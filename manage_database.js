// I need to remove duplicate data before the database grows too big
    // it never shrinks so this has to happen regualarly
// I'm thinking right after I add a set (of documents)
    //check them against the ones in the database for that address
        //including the pruned sets
    //
import {diffArrays} from 'diff';
import divide_removed_strings_into_documents from "./divide_removed_strings_into_documents";
const amount_of_strings_per_context = 5;
const context_mark_character = '\u{2009}';//thin space whitespace character

function get_document_sets_from_address(address)
{
    var DocumentSets = {};
    // pull documents from meilisearch and organized them into sets
    return DocumentSets;
}

function get_strings_from_set(set)
{
    var text_strings = [];
    //extract the strings from the document sets

    return text_strings;
}

function prune_array_of_strings(old_strings, new_strings)
{
    var previous_strings = [];
    var pruned_array_of_strings = [];
    var need_following_text = false;
    // get the strings that were removed in the new strings and create a pruned document from those with some context strings
    diffArrays(old_strings, new_strings, (a, diff)=>{
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
        
    });
    return pruned_array_of_strings;
}

function prune_document_sets(new_strings, address)
{
    var sets = get_document_sets_from_address(address);
    for (const document_set in sets)
    {
        var old_strings = get_strings_from_set(sets[document_set]);
        var pruned_array_of_strings = prune_array_of_strings(old_strings, new_strings);
        if (!!pruned_array_of_strings.length)
        {
            var document_data = {
                set_id: document_set[0].set_id,
                address: document_set[0].address,
                title: document_set[0].title,
                text_strings: pruned_array_of_strings, //hold strings to be divided among series of documents
                page: 1
            };
            divide_removed_strings_into_documents(document_data);
        }

    }
}
