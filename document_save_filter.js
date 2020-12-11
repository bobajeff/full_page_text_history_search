//This is function determines if documents sould:
//a) Overwrite earlier entries of the same page
//b) Create a new entry
//c) Be discarded

const overwrite = 1, new_entry = 2, discard = 3;
import {diffArrays, diffWords} from 'diff';
const sentenceRegex = /(\S.+?[.!?])(?=\s+|$)/;


export {overwrite, new_entry, discard, save_filter};


async function save_filter(oldtext, newtext){
    //pretection from null and
    //Split into sentences
    oldtext = !!oldtext ? oldtext.split(sentenceRegex) : "";
    newtext = !!newtext ? newtext.split(sentenceRegex) : "";
    return new Promise((resolve) => {
        async function document_signal(added, removed) {
            // console.log('added:' + added + " removed:" + removed)
            if (added > 0 && removed == 0)
            {
                //Overwrite
                return resolve(overwrite);
            }
            if (added > 0 && removed > 0)
            {
                //New Entry
                return resolve(new_entry);
            }
            if ((added == 0 && removed > 0) || (added == 0 && removed == 0) )
            {
                //Discard
                return resolve(discard);
            }
        };
        //diff string split into sentences since it's fastest
        diffArrays(oldtext, newtext, (a, diff) => {
            // console.log(diff);
            const last_index = diff.length -1;
            var removed_total = 0;
            var added_total = 0;
            var removed_sentences = [];
            var added_sentences = [];
            
            diff.forEach((elm, index) =>{
                if (elm.added)
                {
                    added_total += elm.count;
                    elm.value.forEach((sentence)=>{
                        added_sentences.push(sentence);
                    });
                }
                if (elm.removed)
                {
                    removed_total += elm.count;
                    elm.value.forEach((sentence)=>{
                        removed_sentences.push(sentence);
                    });
                }
                if (last_index == index)
                {
                    if (removed_sentences.length == added_sentences.length) //This means the only the words in the sentences changed not the number of sentences
                    {
                        if (removed_sentences.length == 0) //check if they're equal to 0 (added_length is also 0)
                        {
                            return document_signal(added_total, removed_total);
                        }
                        else {
                            const index_of_last_array = removed_sentences.length -1;
                            var max_words_removed_in_sentence = 0;
                            var max_words_added_in_sentence = 0;
                            for (var sentence_index = 0; sentence_index <= index_of_last_array; sentence_index++)
                            {
                                diffWords(removed_sentences[sentence_index], added_sentences[sentence_index], (a, word_diff) => {
                                    // console.log(word_diff);
                                    const last_word_index = word_diff.length -1;
                                    var removed_words = 0;
                                    var added_words = 0;
                                    word_diff.forEach((word_elm, word_index) => {
                                        if (word_elm.added)
                                        {
                                            added_words += word_elm.count;
                                        }
                                        if (word_elm.removed)
                                        {
                                            removed_words += word_elm.count;
                                        }
                                        if (last_word_index == word_index)
                                        {
                                            if (added_words > max_words_added_in_sentence)
                                            {
                                                max_words_added_in_sentence = added_words;
                                            }
                                            if (removed_words > max_words_removed_in_sentence)
                                            {
                                                max_words_removed_in_sentence = removed_words;
                                            }
                                        }
                                    })
                                })
                                if (sentence_index == index_of_last_array)
                                {
                                    if (max_words_added_in_sentence == 0)
                                    {
                                        return document_signal(0, removed_total);
                                    }
                                    else if (max_words_removed_in_sentence > 0 && max_words_removed_in_sentence == 0)
                                    {
                                        return document_signal(added_total, 0);
                                    }
                                    else
                                    {
                                        return document_signal(added_total, removed_total);
                                    }
                                }
                            }

                        }
                    }
                    
                    else { //this means there were changes in the number of sentences
                        return document_signal(added_total, removed_total);
                    }
                }
            });
        });
    });
}