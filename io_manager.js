const write_interval = 20000; //20 seconds 

const word_seperation_regex = /([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/; //Regex used to split string into words

module.exports = async function () {
    // Remove: once migrated to es modules
    const { default: get_document_from_meilisearch} = await import('./get_document_from_meilisearch.mjs');
    const { default: connect_to_meilisearch} = await import('./connect_to_meilisearch.mjs');
    const { save_filter: save_filter, overwrite, new_entry, discard } = await import("./document_save_filter.mjs");

    const client = await connect_to_meilisearch();
    const index = await client.getIndex('pages');
    var write_queue = [];
    var queue_checker_is_on = false;
    
    global.app.events.on('text_updated', async (document) => {
        if (!write_queue.includes(document)) //don't add duplicates to the write queue 
        {
            console.log("to the queue!")
            write_queue.push(document);
            if(!queue_checker_is_on){
                check_queue();
            }
        }
    } );

    async function getDocumentByAddress(address) {
        return await get_document_from_meilisearch(client, address);

    }
    
    async function write_data(){
        //prevent loop from writing the same document again if it's added after removal
        var loop_itrations_left = write_queue.length; //any documents added after this is set will not be written
        var documents = [];

        var loop_promises = [];
        
        while (loop_itrations_left > 0)
        {
            var promise = new Promise(async(resolve)=>{
                var document = await write_queue.shift(); //remove first item in array
                
                var old_document = await getDocumentByAddress(document.address);
                // var old_document = undefined;
                
                var action = await (old_document === undefined) ? new_entry : await save_filter(old_document.livetext, document.livetext);
                
                await console.log('action');
                await console.log(await(action == overwrite) ? "overwrite" : (action == new_entry) ? "new_entry" : "discard" );
                if (action == new_entry) // Write new entry
                {
                    let data = await document;
                    //REMOVE: Test to see if the word count goes over 1000
                    console.log(document.livetext.split(word_seperation_regex).length);
                    
                    await documents.push({
                        id: data.timestamp, //make timestamp the id. Later I"ll be able update the timestamp but not the id
                        timestamp: data.timestamp,
                        address: data.address,
                        title: data.title,
                        livetext: data.livetext
                    });
                    resolve();
                }
                if (action == discard) // Don't Write anything
                {
                    resolve();
                    //do nothing!
                }
                if (action == overwrite) // Overwrite previous entry
                {
                    let data = document;
                    
                    await documents.push({
                        id: old_document.id, //Old Id so it get overwritten instead of creating a new document
                        timestamp: data.timestamp,
                        address: data.address,
                        title: data.title,
                        livetext: data.livetext
                    });
                    resolve();
                }
                
            });
            
            await loop_itrations_left--; //reduce iteration
            loop_promises.push(promise);
            
            //write data to file;
            // console.log(data);
        }
        
        await Promise.all(loop_promises);
        //send to be indexed
        if (!!documents.length){
            // documents.forEach((doc)=>{console.log(doc)});
            let response = await index.addDocuments(documents);
            //REMOVE: Show Update Status 
            let updateStatus = await client.getIndex('pages').getUpdateStatus(response.updateId);
            console.log(updateStatus);
        }

        if (write_queue.length == 0) //turn on que
        {
            queue_checker_is_on = false;
        }
        else {
            setTimeout(write_data, write_interval);
        }
    }

    async function check_queue(){
        console.log('check queue');
        queue_checker_is_on = true;
        setTimeout(write_data, write_interval);
        // write_timer = setInterval(await write_data, write_interval);
    }

}