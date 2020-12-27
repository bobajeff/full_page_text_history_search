import {promises as fs} from 'fs';
import connect_to_meilisearch from './connect_to_meilisearch.js';
import divide_strings_into_documents from './divide_strings_into_documents.js';
import prune_index from './prune_index.js';

export default async function () {
    const client = await connect_to_meilisearch();
    const index = await client.getIndex('pages');
    var handled_data = [];
    //Resume prunning the addresses from last time if they didn't get done
    var logs_of_addresses_being_pruned = (await fs.readFile('logs/addresses_to_prune.log', {encoding: 'utf8'}).catch(reason=>{}));
    var addresses_being_pruned = [];
    // var address_to_prune_log_file = await fs.createWriteStream('logs/addresses_to_prune.log', {flags: 'w', encoding: 'utf8'});
    var cleanup_running = false;
    if (logs_of_addresses_being_pruned != "" && logs_of_addresses_being_pruned != undefined)
    {
        addresses_being_pruned = logs_of_addresses_being_pruned.split('\n');
        cleanup_running = true;
        run_index_cleanup();
    }
    
    global.app.events.on('text_updated', handle_incomming_document_data);
    async function handle_incomming_document_data(document_data){
        if (!handled_data.includes(document_data)) 
        {
            if (!!document_data.text_strings.length)
            {
                document_data.proccessing_data = true;
                handled_data.push(document_data);
                let created_documents = await divide_strings_into_documents(document_data);
                document_data.updateId = (await index.updateDocuments(created_documents)).updateId;
                if(!addresses_being_pruned.includes(document_data.address))
                {
                    addresses_being_pruned.push(document_data.address);
                    fs.writeFile('logs/addresses_to_prune.log', addresses_being_pruned.join('\n'), "utf-8");//update log
                }
                if (!cleanup_running)
                {
                    cleanup_running = true;
                    setTimeout(run_index_cleanup, 1000); //1 second
                }
                document_data.proccessing_data = false;
            }
        }
        else 
        {
            if (!!document_data.updateId)
            {
                let {status} = await index.getUpdateStatus(document_data.updateId);
                console.log(status);//DEBUG
                // if (status == 'processed')
                // {

                // }
            }
            if (!document_data.proccessing_data)
            {
                handled_data.splice(handled_data.indexOf(document_data),1);
            }
        }
    }

    //Run Prunning Function when the document_data state is idle (no more text_updated)
    async function run_index_cleanup()
    {
        let cleanup_tasks = [];
        var address_index_end = addresses_being_pruned.length -1;
        while(address_index_end >= 0)
        {
            cleanup_tasks.push((async()=>{
                --address_index_end;
                if (!!cleanup_tasks.length)
                {
                    await cleanup_tasks[cleanup_tasks.length -1];
                }
                await prune_index(index, addresses_being_pruned[0]);
                addresses_being_pruned.shift();
                fs.writeFile('logs/addresses_to_prune.log', addresses_being_pruned.join('\n'), "utf-8");//update log
                return;
            })());
        }
        await Promise.all(cleanup_tasks);
        cleanup_running = false;
    }

}