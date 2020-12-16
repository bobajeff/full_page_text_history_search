import connect_to_meilisearch from './connect_to_meilisearch.js';

;(async () => {
  const client = await connect_to_meilisearch();

  const index = await client.createIndex('pages'); 

//   var documents = [];
//   //remove this document after first run
//   documents.push({
//     id: Date.now(), //make timestamp the id. Later I"ll be able update the timestamp but not the id
//     timestamp: Date.now(),
//     address: "dummy_doc",
//     title: "",
//     text: ""
//   });

//   let response = await index.addDocuments(documents);
//  console.log(response);
console.log(index);
})()