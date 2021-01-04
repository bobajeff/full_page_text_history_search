//TODO: update to be able to fetch series of documents from head document
// Probably want to combine the text into one document for running throught the save filter
const select_overlap_regex = /\u{200A}([^\u{200A}]*)\u{200A}/gu; //select text blocks with overlap marker (whitespace character)
const string_split_character = '\u{200B}'; //select text blocks with overlap marker (whitespace character)
export default async function (client, address)
{
    return new Promise(async(resolve) => {
        const index = client.getIndex('pages');
        const search = await index.search("", {filters: 'address = '+ '"' + address + '"'});

        if (!!search.hits && search.hits.length != 0)
        {
            // Until MeiliSearch has the sortBy feature (https://github.com/meilisearch/MeiliSearch/issues/730) we have to do this ourselves
            // sort documents by date (decending?)
            let by_date = await search.hits.sort((a,b) => b.timestamp - a.timestamp);
            // get set id of the latest document
            let set_id = await by_date[0].set_id;
            // filter out the documents not containing the set_id
            let filtered_out = await by_date.filter(a => a.set_id == set_id);
            // sort documents by page order (ascending?)
            let page_ordered = await filtered_out.sort((a,b) => a.page - b.page);

            var text = "";
            var promises = [];
            page_ordered.forEach(document => {
                promises.push(
                new Promise(async(resolve)=>
                {
                    text += document.text;
                    resolve();
                })
                );
            });
            await Promise.all(promises);

            // var text = page_ordered[1].text;
            var text_minus_overlaps = await text.replace(select_overlap_regex, '');
            var strings = await text_minus_overlaps.split(string_split_character);

            return resolve(strings);
        }
        else
        {
            return resolve(undefined);
        }
        
    });
}
