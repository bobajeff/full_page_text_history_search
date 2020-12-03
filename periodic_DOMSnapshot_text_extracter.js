//This function captures text by taking a snapshot and extracting text from it
//5 seconds after a response from the page, it will update the snapshot/text 
module.exports = async function(page, cdp){
    RunSnapshotOperations(cdp);

    var response_itr = 0;
    var last_snapshot_time = Date.now();
    var waiting_for_time_out = false;
    const interval = 5000; //5 seconds
    await page.on('response', async () => {
        console.log('[response event]');
        console.log(response_itr++);
        let this_time = Date.now();
        var elapsed_time = this_time - last_snapshot_time;
        if (!waiting_for_time_out) //if timer isn't set
        {
            if(elapsed_time >= interval){ //wait untill elapsedtime is more or equal to interval
                RunSnapshotOperations(cdp);
            }
            else { //if it's not start timer for when it'll meet the interval
                waiting_for_time_out = true;
                setTimeout(() => {
                    RunSnapshotOperations(cdp);
                    waiting_for_time_out = false;
                }, interval - elapsed_time);
            }
        }
    });

    async function RunSnapshotOperations(cdp)
    {
        await SnapshotOperations(cdp);
        last_snapshot_time = Date.now();
    }

    async function SnapshotOperations(cdp)
    {
        var document = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: [], includeDOMRects: true });
        var {parentIndex, nodeType, nodeName, nodeValue, backendNodeId} = document['documents'][0]['nodes'];//TODO: use attributes for the cases where DOMRects failes on detecting visibility
        var {nodeIndex, clientRects} = document['documents'][0]['layout'];

        var visible = await Array(nodeName.length).fill(false); //create array to mirror nodeName array and populate it with true/false values
        
        //check clientRect property to judge if node is visible or not
        await nodeIndex.forEach(async(node_index_value, itr) => {
            var parent_client_rect_property = clientRects[itr];
            if (parent_client_rect_property != undefined)
            {
                //                             width                                height
                if (!!parent_client_rect_property[2] || !!parent_client_rect_property[3] || !!parent_client_rect_property.length){
                    visible[node_index_value] = true;
                }
            }
        
        });
        
        var text_content = "";
        nodeType.forEach(async (node_type, itr) => {
            var parent_index = parentIndex[itr];
            let parent_string_index = nodeName[parent_index];
            let value_index = nodeValue[itr];
            
            
            var value_string = document['strings'][value_index];
            var parent_string = document['strings'][parent_string_index];

            //make sure value string is not undefined
            if (!!value_string)
            {
                //don't add script noscript or style nodes
                if (parent_string != 'SCRIPT' && parent_string != 'NOSCRIPT' && parent_string != 'STYLE') {
                    if (node_type == 3){ // check if node is text type
                        if (/[^\s]/m.test(value_string))  // remove any tags that contain only whitespace
                        {
                            if (visible[parent_index] == true)
                            {
                                var prefix = ""
                                //check if first child
                                if (itr != 0 && backendNodeId[itr -1] == backendNodeId[parent_index]) //if previous node equals parent node
                                {
                                    prefix = " ";
                                }
                                //replace many whitespace characters with one space as thats more likely 
                                var text_sanitized = prefix + value_string.replace(/\s+/g, " ");
                                text_content += text_sanitized;
                            }
                        }
                    }
                }
            }
        });
        console.log(text_content);
    }
 }