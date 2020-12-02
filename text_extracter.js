/* 
Takes a CDPSession and returns a string of text
 */
module.exports = async function (page, cdp){
    var pagetext = await evaluateMethod(page);
    console.log(pagetext);

    //var frameTree = await cdp.send('Page.captureSnapshot');
    //console.log(frameTree);
    //captureSnapshotMethod(cdp);

     
 };

 async function evaluateMethod(page){
     //page.on('console', msg => console.log('PAGE LOG:', msg.text()));
     let hasAddToText = await page.evaluate(() => {return window.addToText});
     if(!hasAddToText)
     {
         await page.exposeFunction('addToText', async text => {
             console.log('added text');
             console.log(text);
         });
     }

     return page.evaluate(()=>{

        var addedTextNodes = []; //array for holding references to node that have been added
        function getTextFromDOMTree (node, contentString) {
            //filter out 1) all the Script/NoScript/Style tags 2) any non-text nodes 3) any strings containing only whitespace characters 4) any non-visible text nodes
            var filter = {
                acceptNode: function(n) {
                    return n && n.parentNode && n.parentNode.tagName != "SCRIPT" && n.parentNode.tagName != "NOSCRIPT" && n.parentNode.tagName != "STYLE" && n.nodeType == Node.TEXT_NODE && /[^\s]/m.test(n.textContent) && (!!n.parentNode.clientHeight || !!n.parentNode.clientWidth || !!n.parentNode.getClientRects().length)
                      ? NodeFilter.FILTER_ACCEPT
                      : NodeFilter.FILTER_REJECT;
                }
            };
            var nodes = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, filter);
            var currentNode = nodes.currentNode;
            //run a check on the first node from the treewalker as it doesn't have to pass the filter
            if (currentNode != Node.TEXT_NODE)
            {
                currentNode = nodes.nextNode();
            }
            if (!currentNode)
            {
                //Exit out of function
                // console.log('is this exiting?');
                return contentString;
            }
            while(currentNode) {
                //check to see if node was already added
                if (addedTextNodes.includes(currentNode))
                {
                    //console.log('you already added this!');
                } else {
                    var prefix = "";
                    if (!currentNode.previousSibling)
                    {
                        prefix = " ";//add a spcae if the node is the first child.
                    }
                    var textString = prefix + currentNode.textContent.replace(/\s+/g, " ");//remove extra white space characters
                    contentString += textString;
                    addedTextNodes.push(currentNode);
                    currentNode = nodes.nextNode();
                }
              }
            return contentString;
        }


        var pagetext = getTextFromDOMTree(document.body, String());
        //  console.log('pagetext');
        // console.log(pagetext);
        
        //observe changes to the DOM where text is added and send them to the addToText function
        const config = { childList: true, subtree: true, characterData: true, characterDataOldValue : true };
        const observer = new MutationObserver(function(mutations){
            //console.log(mutations);
            var text = "";
            mutations.forEach(function(mutation, mutation_index){
                //console.log(mutation.type);
                if (mutation.type == 'childList')
                {
                    mutation.addedNodes.forEach((node, node_index)=>{
                        var addedtext = getTextFromDOMTree(node, String());
                        if (addedtext != "")
                        {
                            // console.log('mutation: ' + mutation_index + " node: " + node_index);
                            // console.log('addedtext');
                            // console.log(addedtext);
                            text += addedtext;
                        }
                    });
                }
            })
            //console.log('mutation occured\n');
            if (text != "")
            {
                window.addToText(text);
            }
        });
        observer.observe(document.body, config);
        return pagetext;
    });
 }

async function captureSnapshotMethod(cdp){
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
    
    var str_array = [];
    nodeType.forEach(async (node_type, itr) => {
        var parent_index = parentIndex[itr];
        let parent_string_index = nodeName[parent_index];
        let value_index = nodeValue[itr];
        
        
        var value_string = document['strings'][value_index];
        var parent_string = document['strings'][parent_string_index];
        
            
            //don't add script noscript or style nodes
            if (parent_string != 'SCRIPT' && parent_string != 'NOSCRIPT' && parent_string != 'STYLE') {
                if (node_type == 3){ // check if node is text type
                    if (/[^\s]/m.test(value_string))  // remove any tags that contain only whitespace
                    {
                        if (visible[parent_index] == true)
                        {
                            //replace many whitespace characters with one space as thats more likely 
                            /* attribute_strings.filter(attribute_string => attribute_string == "aria-hidden");
                            str_array.push('hidden'); */
                            var text_sanitized = value_string.replace(/\s+/g, " ");
                            str_array.push(text_sanitized);
                        }
                }
            }
        }
    });
    console.log(str_array);
 }