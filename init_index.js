import connect_to_meilisearch from './connect_to_meilisearch.js';

;(async () => {
  const client = await connect_to_meilisearch();

  const index = await client.createIndex('pages'); 
  var documents = [];
  //remove this document after first run
  documents.push({
    id: Date.now(),
    address: "dummy_doc",
  });

  let response = await index.addDocuments(documents);
 console.log(response);
console.log(index);
})()