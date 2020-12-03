var crypto = require("crypto");

/* 
Takes a CDPSession and returns a string of text
 */
module.exports = async function (page, cdp){
// await evaluateMethod(page);
 
    captureSnapshotMethod(page, cdp);

     
 };

 //This function caputers text by injecting a javascript function into the page that traverses the DOM, send back the extracted text (through the ChromeDevTools Protocol)
 //It also checks for changes in the DOM and sends back the text as it's added to the DOM
 async function evaluateMethod(page){
     //Function to get random integer
     function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); 
      }

     var randomLength = await getRandomInt(20,50); //RandomLength to feed the crypto.randomBytes length

     var addToTextRandomString = await crypto.randomBytes(randomLength).toString('base64'); //Create a random Function name
     //Function to recieve live text when processed by evaluate
     await page.exposeFunction(addToTextRandomString, async text => {
         console.log('added text');
         console.log(text);
     });

     //Turn function into string so I can replace the function name in evaluate space
     var StringToEvaluate = (()=>{ //Anonymous function to keep the global namespace clean
         function DOMoperations()
         {
             var addedTextNodes = []; //Array for holding references to nodes that have been added
             function getTextFromDOMTree (node, contentString) {
                 //Filter out 1) all the Script/NoScript/Style tags 2) any non-text nodes 3) any strings containing only whitespace characters 4) any non-visible text nodes 5) any nodes not added to the addedTextNodes array already
                 var filter = {
                     acceptNode: function(n) {
                         return n && n.parentNode && n.parentNode.tagName != "SCRIPT" && n.parentNode.tagName != "NOSCRIPT" && n.parentNode.tagName != "STYLE" && n.nodeType == Node.TEXT_NODE && /[^\s]/m.test(n.textContent) && (!!n.parentNode.clientHeight || !!n.parentNode.clientWidth || !!n.parentNode.getClientRects().length) && !addedTextNodes.includes(n)
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
                     return contentString;
                 }
                 while(currentNode) {
                     //Check to see if node was already added (still have to run this here because every loop I add more and the filter is only run on the ones added prior)
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
 
             //Get text that's already loaded in the DOM and send to addToText function
             var pagetext = getTextFromDOMTree(document.body, String());
             if (pagetext != ""){ //don't send back empty string
                 window['addToText'](pagetext);
             }
             
             //Observe changes to the DOM where text is added and send them to the addToText function
             const config = { childList: true, subtree: true, characterData: true, characterDataOldValue : true };
             const observer = new MutationObserver(function(mutations){
                 var text = "";
                 mutations.forEach(function(mutation){
                     if (mutation.type == 'childList')
                     {
                         mutation.addedNodes.forEach((node)=>{
                             var addedtext = getTextFromDOMTree(node, String());
                             if (addedtext != "")
                             {
                                 text += addedtext;
                             }
                         });
                     }
                 })
                 if (text != "") //Don't add empty strings
                 {
                     window['addToText'](text);
                 }
             });
             observer.observe(document.body, config);
         }
         //Need to wait for document.body to be available before running most of the operations
         if (document.readyState === 'loading') {  // Loading hasn't finished yet
             document.addEventListener('DOMContentLoaded', DOMoperations);
         } else {  // `DOMContentLoaded` has already fired
             DOMoperations();
         }
     }).toString();

     await page.evaluate('(' + StringToEvaluate.replace(/addToText/gm, addToTextRandomString) + ')();'); 
 }

//This function captures text by taking a snapshot and extracting text from it
//5 seconds after a response from the page, it will update the snapshot/text 
async function captureSnapshotMethod(page, cdp){

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
 }