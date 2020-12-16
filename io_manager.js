import connect_to_meilisearch from './connect_to_meilisearch.js';
import divide_strings_into_documents from './divide_strings_into_documents.js';
import write_to_file from './write_document_objects_test_files.js';

export default async function () {
    const client = await connect_to_meilisearch();
    const index = await client.getIndex('pages');
    var handled_data = [];
    
    global.app.events.on('text_updated', handle_incomming_document_data);
    async function handle_incomming_document_data(document_data){
        if (!handled_data.includes(document_data)) 
        {
            document_data.proccessing_data = true;
            handled_data.push(document_data);
            // await write_to_file(document_data);
            let created_documents = await divide_strings_into_documents(document_data);
            let response = await index.addDocuments(created_documents);
            let updateStatus = await client.getIndex('pages').getUpdateStatus(response.updateId);
            console.log(updateStatus);
            document_data.proccessing_data = false;
        }
        else 
        {
            if (!document_data.proccessing_data)
            {
                handled_data.splice(handled_data.indexOf(document_data),1);
            }
        }
    }

}