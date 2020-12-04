var crypto = require("crypto");
//This function caputers text by injecting a javascript function into the page that send back the extracted text (through the ChromeDevTools Protocol)
 //When the DOM nodes are changed it sends back only the text that's changed
 module.exports = async function(page, document){
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
        document.livetext += text;
        global.app.events.emit('text_updated', document);
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