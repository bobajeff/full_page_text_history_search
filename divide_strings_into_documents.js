const non_token_seperator_regex = /[^\s()'"\\\/:@_\-.;,!?]+/g; //Attemp to get tokens defined by meilisearch see: classify_separator at: https://github.com/meilisearch/MeiliSearch/blob/3423c0b246a2bacd12a16d38eaa640217e2eda1b/meilisearch-tokenizer/src/lib.rs
const token_plus_seperator_regex = /[^\s()'"\\\/:@_\-.;,!?]+|[\s()'"\\\/:@_\-.;,!?]+/g; //need this to get size of original string minus my extraction
const word_limit = 1000; //The number of words in a string meilisearch will index before ignoring the rest
const token_overlap = 30; //How many tokens to copy into the next document (if it comes to that)
const string_overlap = 5; //How many strings to copy into the next document
//These are here so I can extract the original array of strings when retrieving these from the database using regex
//These have to be non-normal space whitespace characters because they are the only characters which Meilisearch ignores and I don't keep in the strings from from the text extracter
const string_split_character = '\u{200B}';//zerowidth whitespace character
const overlap_mark_character = '\u{200A}';//hairspace whitespace character
var documents = [];
var previous_text_strings = [];

function create_document(text, document_data)
{
    var document = {
        document_type: document_data.document_type,
        id: document_data.id_to_use,
        set_id: document_data.set_id,
        timestamp: document_data.timestamp,
        address: document_data.address,
        title: document_data.title,
        text: text,
        page: document_data.page,
        checked: document_data.checked
    };
    documents.push(document);
}

function divide_single_string_into_documents(textString, token_count, callback)
{
    while (token_count > word_limit)
    {
        let excess_words = token_count - word_limit;
        var tokens_and_seperators = textString.match(token_plus_seperator_regex);
        // -1 if last index is a token | 0 if it's a seperator
        var adjustment = (non_token_seperator_regex.test(tokens_and_seperators[tokens_and_seperators.length -1])) ? -1 : 0;
        let amount_to_substract = (excess_words * 2) + adjustment;
        //substract tokens
        let tokens_and_seperators_sliced = tokens_and_seperators.slice(amount_to_substract);
        var textString_sliced = tokens_and_seperators_sliced.join('');
        token_count = excess_words + token_overlap; //update token count
        //update textString for next loop
        let overlap_tokens = tokens_and_seperators_sliced.slice(- (token_overlap * 2)); //get overlap from the sliced token
        let remainder_tokens = tokens_and_seperators.slice(- amount_to_substract);
        var textString = overlap_mark_character + overlap_tokens.join('') + overlap_mark_character + remainder_tokens.join('');
        callback(textString_sliced);
    }
    return textString;
}

export default async function (document_data){
    return new Promise(async(resolve)=>{
        var left_over_text = (!!document_data.last_document) ? document_data.last_document.text : "";
        document_data.id_to_use = (!!document_data.id_to_use) ? document_data.id_to_use : Date.now();

        while (!!document_data.text_strings.length)
        {
            var textString = document_data.text_strings[0] + string_split_character;
            let token = textString.match(non_token_seperator_regex);
            let token_count = (!!token) ? token.length : 0;
            let left_over_tokens = left_over_text.match(non_token_seperator_regex);
            let left_over_tokens_count = (!!left_over_tokens) ? left_over_tokens.length : 0;
            let combined_token_count = token_count + left_over_tokens_count;
            if (token_count > word_limit) //If String is too big
            {
                left_over_text = divide_single_string_into_documents(textString, token_count, (sliced_string)=>{
                    create_document(sliced_string, document_data);
                    document_data.page++;
                    document_data.id_to_use = Date.now();
                });
            }
            else if (left_over_tokens_count > word_limit)
            {
                left_over_text = divide_single_string_into_documents(left_over_text, left_over_tokens_count, (sliced_string)=>{
                    create_document(sliced_string, document_data);
                    document_data.page++;
                    document_data.id_to_use = Date.now();
                });
            }
            else if (combined_token_count > word_limit) //If combined String is too big
            {
                create_document(left_over_text, document_data);
                document_data.page++;
                document_data.id_to_use = Date.now();
                let overlap_strings = previous_text_strings.slice(- string_overlap);
                let overlap = overlap_strings.join('');
                left_over_text = overlap_mark_character + overlap + overlap_mark_character + textString;
            }
            else
            {
                left_over_text += textString;
            }
            previous_text_strings.push(document_data.text_strings.shift());
        }
        //remove last character (which is a string split character)
        create_document(left_over_text.slice(0, -1), document_data); //put the rest in a new document
        document_data.last_document = documents[documents.length -1]; //set last document for next run
        resolve(documents);

    });

}