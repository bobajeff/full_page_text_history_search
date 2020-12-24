// Remove duplicate data regularly so the database grows too big on drive (it never shrinks)
// After a set (of documents) is added
    //check them against the ones in the database for that address
        //including the pruned sets

import {diffArrays} from 'diff';
import divide_strings_into_documents from "./divide_strings_into_documents.js";
const amount_of_strings_per_context = 5;
const select_overlap_regex = /\u{200A}([^\u{200A}]*)\u{200A}/gu;
const string_split_character = '\u{200B}'; //select text blocks with overlap marker (whitespace character)

function prune_index(index, address)
{
    return new Promise(resolve=>{
        index.search("", {filters: 'address = "' + address + '"', limit: 100}).catch(reason=>{}).then((search)=>{
            //exit if no hits (address not found)
            if (!search.hits.length)//TODO: || search.hits.length == 1
            {
                resolve();
            }
            else
            {
                var document_sets = {};
                var ids = [];
                var set_data = [];
                // pull documents from meilisearch and organized them into sets
                for (const hit of search.hits)
                {
                    if (!document_sets[hit.set_id])
                    {
                        document_sets[hit.set_id] = [];
                    }
                    document_sets[hit.set_id].push(hit);
                    ids.push(hit.id);
                }
                //Get the strings and document_data for each set 
                for (const set in document_sets)
                {
                    var strings = get_strings_from_set(document_sets[set]);
                    var document_data = {
                        document_type: 'pruned', //DEBUG
                        timestamp: document_sets[set][0].timestamp,
                        set_id: document_sets[set][0].set_id,
                        address: document_sets[set][0].address,
                        title: document_sets[set][0].title,
                        page: 1,
                        checked: document_sets[set][0].checked
                    };
                    set_data.push({strings: strings, document_data: document_data});
                }
                // sort set by date (decending?)
                set_data.sort((a,b) => b.document_data.timestamp - a.document_data.timestamp); 
                prune_sets(set_data).then((document_data_array)=>{
                    var documents = [];
                    let document_creation_tasks = [];
                    for (document_data of document_data_array)
                    {
                        document_creation_tasks.push(
                            new Promise(resolve=>{
                                divide_strings_into_documents(document_data).then((created_documents)=>{
                                    documents = documents.concat(created_documents);
                                    resolve();
                                });
                            })
                        );
                    }
                    Promise.all(document_creation_tasks).then(()=>{
                        index.deleteDocuments(ids);
                        index.updateDocuments(documents).then(response=>{
                            resolve();
                        //     // index.getUpdateStatus(response.updateId).then(updateStatus=>{
                        //     //     console.log(updateStatus); //DEBUG:
                        //     // });
                        });
                        console.log('finished prunning');//DEBUG:
                    });
                });
            }
        });
    });
}

async function prune_sets(set_data)
{
    return (async ()=>{
        // Go through sets and find the the sets that aren't checked
        //If they aren't checked compare against older sets
        // first go backwards through array
        var compare_older_set_tasks = [];
        var prune_tasks = [];
        for (var index = set_data.length -1; index >= 0; index--) //iterate backwards towards 0
        {
            compare_older_set_tasks.push(
                (async (index)=>{
                    //if not checked and not the last index iterate forward (towards the older sets)
                    if (!set_data[index].document_data.checked && index != (set_data.length -1))
                    {
                        //Make sure we run these in order
                        prune_tasks.push((async (index, index_of_last_prune_task)=>{
                            let loop_promises = [];
                            if (!!prune_tasks.length) //If there is a earlier prune task
                            {
                                await prune_tasks[index_of_last_prune_task]; //Wait for the last prune task to complete first
                            }
                            for (var inner_index = index + 1; inner_index <= (set_data.length -1); inner_index++) //index + 1 so it doesn't compare with itself
                            {
                                loop_promises.push(
                                    (async (index, inner_index)=>{
                                        //Don't campare strings if any of the comparing sets are being dicarded
                                        if (!set_data[index].discard && !set_data[inner_index].discard)
                                        {
                                            let [added, pruned_strings] = await prune_array_of_strings(set_data[inner_index].strings, set_data[index].strings);
                                            // console.log(added);//DEBUG
                                            if (added)
                                            {
                                                if (!!pruned_strings.length)
                                                {
                                                    set_data[inner_index].strings = pruned_strings;
                                                }
                                                else //discard older set if nothing was removed (newer set has more strings)
                                                {
                                                    set_data[inner_index].discard = true;
                                                }
                                            }
                                            else //discard the newer set if nothing was added (this set has more strings then)
                                            {
                                                set_data[index].discard = true;
                                            }
                                            return;
                                        }
                                        else
                                        {
                                            return;
                                        }
                                    })(index, inner_index)
                                );
                            }
                            await Promise.all(loop_promises);
                            set_data[index].document_data.checked = true;
                            return;
                        })(index, prune_tasks.length -1));
                        return;
                    }
                    else
                    {
                        return;
                    }
                })(index)
            );
        }
        await Promise.all(compare_older_set_tasks);
        await Promise.all(prune_tasks);
        
        // Finish creating the documents_data objects return them
        let loop_promises = [];
        var document_data_array = [];
        for (var index = 0; index <= (set_data.length -1); index++)
        {
            // console.log(set_data[index].discard);
            loop_promises.push((async(index)=>{
                if (!set_data[index].discard)
                {
                    set_data[index].document_data.text_strings = set_data[index].strings;
                    document_data_array.push(set_data[index].document_data);
                }
                return;
            })(index));
        }
        await Promise.all(loop_promises);
        return document_data_array;
    })();

}


function get_strings_from_set(set)
{
    //extract the strings from the document sets
    var text = '';
    let page_ordered_set = set.sort((a,b) => a.page - b.page);
    for (const document of page_ordered_set)
    {
        text += document.text;
    }
    let text_minus_overlap = text.replace(select_overlap_regex, '');
    let text_strings = text_minus_overlap.split(string_split_character);
    return text_strings;
}

function prune_array_of_strings(old_strings, new_strings)
{
    return new Promise(resolve=>{
        // get the strings that were removed in the new strings and create a pruned document from those with some context strings
        var previous_strings = [];
        var pruned_array_of_strings = [];
        var need_following_text = false;
        var added = false;
        diffArrays(old_strings, new_strings, (a, diff)=>{
            // console.log(diff);
            for (const part of diff)
            {
                if (!part.removed && !part.added)
                {
                    //add context following removed text
                    if (need_following_text)
                    {
                        let context = ((part.value.length -1) >= amount_of_strings_per_context) ? part.value.slice(0, amount_of_strings_per_context) : part.value;
                        pruned_array_of_strings = pruned_array_of_strings.concat(context);
                        need_following_text = false; //Set to false after adding text
                    }
                    //assign value array to previous strings
                    previous_strings = part.value; 
                }
                else if (part.removed)
                {
                    //try to get preceding strings if they exist
                    if (!!previous_strings.length)
                    {
                        let context = ((previous_strings.length -1) >= amount_of_strings_per_context) ? previous_strings.slice(-amount_of_strings_per_context) : previous_strings;
                        let removed_strings = part.value;
                        pruned_array_of_strings = pruned_array_of_strings.concat(context, removed_strings);
                    }
                    else
                    {
                        let removed_strings = part.value;
                        pruned_array_of_strings = pruned_array_of_strings.concat(removed_strings);
                    }
                    need_following_text = true; //Set to true so I can get the following text
                }
                else if (part.added)
                {
                    added = true;
                }
            }
            resolve([added, pruned_array_of_strings]);
        });
    });

}

export default prune_index;