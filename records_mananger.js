// If the the page has added any new strings create a new document
    // Update the Document with the new strings (use up the old ids)
    // Create a seperate Documents with the removed string plus context and the old timestamp
        //Context will be strings preceding and following the removed strings (like overlaped string in normal document but both sides this time)
// If no changes were made or the only changes are missing strings then discard document
import {diffArrays} from 'diff';
const string_split_character = '\u{200B}';//zerowidth whitespace character
const context_mark_character = '\u{2009}';//thin space whitespace character

function getChanges(old_document_data, new_document_data){
    var old_strings = old_document_data.text_strings;
    var new_strings = new_document_data.text_strings;
    var previous_strings = [];
    var removed_text = "";
    var need_following_text = false;
    var new_document = false;
    diffArrays(old_strings, new_strings, (a, diff)=>{
        diff.forEach(part=>{
            //If part isn't removed or added then it is context and should be added to previous strings
            if (!part.removed && !part.added)
            {
                if (need_following_text)
                {
                    //add context following removed text
                    need_following_text = false; //Set to false after adding text
                }
                previous_strings.push(part.value); //This is a guess will have to verify the API
            }
            //If part is removed the it should be added to removed string with the context
            else if (part.removed)
            {
                //try to get preceding context if they exist
                if (!!previous_strings.length)
                {

                }
                removed_text += part.value //This is a guess will have to verify the API
                need_following_text = true; //Set to true so I can get the following text
            }
            // If text is added set new document to true
            else if (!new_document && part.added)
            {
                new_document = true; //Set to true so I know to create a new document
            }
        });

    });


    if (new_document)
    {
        return removed_text;
    }
    else
    {
        return null;
    }

}