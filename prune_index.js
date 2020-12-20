// I need to remove duplicate data before the database grows too big
    // it never shrinks so this has to happen regualarly
// I'm thinking right after I add a set (of documents)
    //check them against the ones in the database for that address
        //including the pruned sets
import {diffArrays} from 'diff';
import divide_strings_into_documents from "./divide_strings_into_documents.js";
const amount_of_strings_per_context = 5;
const select_overlap_and_context_regex = /\u{200A}([^\u{200A}]*)\u{200A}|\u{2009}([^\u{2009}]*)\u{2009}/gu;
const context_mark_character = '\u{2009}';//thin space whitespace character
const string_split_character = '\u{200B}'; //select text blocks with overlap marker (whitespace character)

function get_document_sets_and_ids_from_address(index, address)
{
    return new Promise(resolve=>{
        // pull documents from meilisearch and organized them into sets
        index.search("", {filters: 'address = "' + address + '"'}).then((search)=>{
            var document_sets = {};
            var ids = [];
            for (const hit of search.hits)
            {
                if (!document_sets[hit.set_id])
                {
                    document_sets[hit.set_id] = [];
                }
                document_sets[hit.set_id].push(hit);
                ids.push(hit.id);
            }
            resolve({sets: document_sets, ids:ids});
        });
    });
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
    let text_minus_overlaps_and_context = text.replace(select_overlap_and_context_regex, '');
    let text_strings = text_minus_overlaps_and_context.split(string_split_character);
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
                        context[0] = context_mark_character + context[0];
                        context[context.length -1] = context[context.length -1] + context_mark_character;
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
                        context[0] = context_mark_character + context[0];
                        context[context.length -1] = context[context.length -1] + context_mark_character;
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

function prune_document_sets(new_strings, new_set_id, index, address)
{
    get_document_sets_and_ids_from_address(index, address).then(({sets, ids})=>{
        // console.log('sets before del');//DEBUG:
        // console.log(Object.keys(sets).length);//DEBUG:
        delete sets[new_set_id];//remove new set because we don't want to prune that
        // console.log('sets after del');//DEBUG:
        // console.log(Object.keys(sets).length);//DEBUG:
        var loop_promises = [];
        var documents = [];
        for (const document_set in sets)
        {
            loop_promises.push(
                new Promise(resolve=>{
                    var old_strings = get_strings_from_set(sets[document_set]);
                    prune_array_of_strings(old_strings, new_strings).then(pruned_array_of_strings=>{
                        if (!!pruned_array_of_strings.length)
                        {
                            var document_data = {
                                document_type: 'removed_text',
                                timestamp: sets[document_set][0].timestamp,
                                set_id: sets[document_set][0].set_id,
                                address: sets[document_set][0].address,
                                title: sets[document_set][0].title,
                                text_strings: pruned_array_of_strings, //hold strings to be divided among series of documents
                                page: 1
                            };
                            divide_strings_into_documents(document_data).then(created_documents=>{
                                documents = documents.concat(created_documents);
                                resolve();
                            });
                        }
                        else
                        {
                            resolve();
                        }
                    });
                })
            );

        }
        Promise.all(loop_promises).then(()=>{
            index.deleteDocuments(ids);
            index.addDocuments(documents).then(updateStatus=>{
                // console.log(updateStatus); //DEBUG:
            });
            
        });
    });
}

export default prune_document_sets;