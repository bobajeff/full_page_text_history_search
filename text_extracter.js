module.exports = async function (cdp){//TODO: remove computedStyles visibility option as I'm not using it
    var document = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: ['visibility'], includeDOMRects: true });
    var {parentIndex, nodeType, nodeName, nodeValue, attributes} = document['documents'][0]['nodes'];//TODO: use attributes for the cases where DOMRects failes on detecting visibility
    var {styles, nodeIndex, clientRects} = document['documents'][0]['layout'];
    // console.log('strings');
    // console.log(document['strings']);
    //console.log(document['documents'][0]['layout']);
    //console.log(styles[1]);
    //console.log(document['documents'][0]);
    // console.log('nodeValue');
    // console.log(nodeValue);
    // console.log('nodeName');
    // console.log(nodeName);
    // console.log('clientRects');
    // console.log(clientRects);
    // console.log('parentIndex');
    // console.log(parentIndex);
    // console.log('nodeIndex');
    // console.log(nodeIndex);

    var str_array = []
    nodeType.forEach(async (node_type, itr) => {
        let parent_index = parentIndex[itr];
        let parent_string_index = nodeName[parent_index];
        let value_index = nodeValue[itr];
        
        
        var value_string = document['strings'][value_index];
        var parent_string = document['strings'][parent_string_index];
        
        //don't add script noscript or style nodes
        if (parent_string != 'SCRIPT' && parent_string != 'NOSCRIPT' && parent_string != 'STYLE' ) {
            if (node_type == 3){ // check if node is text type
                if (/[^\s]/m.test(value_string))  // remove any tags that contain only whitespace
                {

                    nodeIndex.forEach(async(node_index_value, node_index_key) => {
                        //check if the parent index points to the current node index
                        //if so the values of the corresponding clientrects can be access by the current index key
                        if (parent_index == node_index_value) 
                        {
                            var parent_client_rect_property = clientRects[node_index_key];
                            if (parent_client_rect_property != undefined)
                            {
                                //                             width                                height
                                if (!!parent_client_rect_property[2] || !!parent_client_rect_property[3] || !!parent_client_rect_property.length){
                                    //replace many whitespace characters with one space as thats more likely 
                                    /* attribute_strings.filter(attribute_string => attribute_string == "aria-hidden");
                                    str_array.push('hidden'); */
                                    var text_sanitized = value_string.replace(/\s+/g, " ");
                                    str_array.push(text_sanitized);
                                }
                            }

                        }

                    });
                    
                    
                }
            }
        }
    });
    console.log(str_array);
     
 };
