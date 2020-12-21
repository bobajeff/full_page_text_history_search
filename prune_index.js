// Remove duplicate data regularly so the database grows too big on drive (it never shrinks)
// After a set (of documents) is added
    //check them against the ones in the database for that address
        //including the pruned sets

import {diffArrays} from 'diff';
import divide_strings_into_documents from "./divide_strings_into_documents.js";
const amount_of_strings_per_context = 5;
const select_overlap_regex = /\u{200A}([^\u{200A}]*)\u{200A}/gu;
const string_split_character = '\u{200B}'; //select text blocks with overlap marker (whitespace character)

import './utilities.js';

function prune_index(new_strings, new_set_id, new_ids, index, address)
{
    index.search("", {filters: 'address = "' + address + '"'}).then((search)=>{
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
        delete document_sets[new_set_id];//remove new set because we don't want to prune that
        //Get the strings and document_data for each set 
        for (const set in document_sets)
        {
            var strings = get_strings_from_set(document_sets[set]);
            var document_data = {
                document_type: 'removed_text',
                timestamp: document_sets[set][0].timestamp,
                set_id: document_sets[set][0].set_id,
                address: document_sets[set][0].address,
                title: document_sets[set][0].title,
                page: 1
            };
            if (!!document_sets[set][0].checked)
            {
                document_data.checked = true;
            }
            set_data.push({strings: strings, document_data: document_data});
        }
        set_data.sort((a,b) => b.document_data.timestamp - a.document_data.timestamp); // sort set by date (decending?)
        prune_sets(set_data, new_strings).then((document_data_array)=>{
            var documents = [];
            let document_creation_tasks = [];
            for (document_data of document_data_array)
            {
                document_creation_tasks.push(
                    new Promise(resolve=>{
                        divide_strings_into_documents(document_data).then(({documents: created_documents})=>{
                            documents = documents.concat(created_documents);
                            resolve();
                        });
                    })
                );
            }
            Promise.all(document_creation_tasks).then(()=>{
                //update the new set to show it's been check against older sets
                for (const id of new_ids)
                {
                    documents.push(
                        {
                            id: id,
                            checked: true
                        }
                    );
                }
                index.deleteDocuments(ids);
                index.updateDocuments(documents).then(updateStatus=>{
                    console.log(updateStatus); //DEBUG:
                });
            });
        });
    });
}

async function prune_sets(set_data, new_strings)
{
    return (async ()=>{
        // Go through sets and find the the sets that aren't checked
            //If they aren't checked compare against older sets
        // first go backwards through array
        var compare_older_set_tasks = [];
        for (let [index, set] of set_data.reverse_entries())
        {
            compare_older_set_tasks.push(
                (async ()=>{
                    //if not checked and not the last index iterate forward (towards the older sets)
                    if (!set.document_data.checked && index != (set_data.length -1))
                    {
                        var prune_tasks = [];
                        //Make sure we run these in order
                        let this_prune_task = await (async ()=>{
                            var strings_to_compare_with = set.strings;
                            let loop_promises = [];
                            if (!!prune_tasks.length) //If there is a promise from last loop
                            {
                                prune_tasks[prune_tasks.length -1].then(async ()=>{
                                    for (let set of set_data.start_at(index + 1))
                                    {
                                        loop_promises.push(
                                            (async ()=>{
                                                let pruned_strings = await prune_array_of_strings(set.strings, strings_to_compare_with);
                                                set.strings = pruned_strings;
                                                return;
                                            })()
                                        );
                                    }
                                });
                            }
                            else //If no promise
                            {
                                for (let set of set_data.start_at(index + 1))
                                {
                                    loop_promises.push(
                                        (async ()=>{
                                            let pruned_strings = await prune_array_of_strings(set.strings, strings_to_compare_with);
                                            set.strings = pruned_strings;
                                            return;
                                        })()
                                    );
                                }
                            }
                            await Promise.all(loop_promises);
                            set.document_data.checked = true;
                            return;
                        })();
                        prune_tasks.push(this_prune_task);
                        return;
                    }
                    else
                    {
                        return;
                    }
                })()
            )
        }
        await Promise.all(compare_older_set_tasks);
        // Go through the sets normally and check against the new_strings
        let loop_promises = [];
        var document_data_array = [];
        for (const set of set_data)
        {
            loop_promises.push(
                (async ()=>{
                   let pruned_array_of_strings = await prune_array_of_strings(set.strings, new_strings);
                    if (!!pruned_array_of_strings.length)
                    {
                        set.document_data.text_strings = pruned_array_of_strings;
                        document_data_array.push(set.document_data);
                    }
                    return;
                })()
            );
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
            }
            resolve(pruned_array_of_strings);
        });
    });

}

export default prune_index;