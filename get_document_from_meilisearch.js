export default async function (client, address) {
    return new Promise(async(resolve) => {
        const index = client.getIndex('pages');
        var searchfilter = {
            filters: 'address = '+ '"' + address + '"',
          }
         const search = await index.search("", searchfilter);
        // const pages_index = client.getIndex('pages').show()
        //var documents = client.getIndex('pages').getDocuments({ attributesToRetrieve: ['id', 'address', 'head', 'body'] })

          if (!!search.hits)
          {
              return resolve(search.hits[0]);
          }
          else
          {
              return resolve(undefined);
          }
        
    });
}