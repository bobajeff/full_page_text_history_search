const fs = require('fs');

module.exports.getPageJson = async function(address, page) {
  await page.goto(address);

  const text_nodes = await page.evaluate(() => {
    function ready() {
        var text_nodes; //[{level, element, text},...]
        var text_nodes_concatenated = "";
        
        function getNodeContent(node){
          var contentString = "";
          contentString = allDescendants(node, 0, contentString);
          //clean up the string because textContent will give non-rendered white space characters from source code as the string
          return contentString.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
        }
        //iterate through all the nodes in the document (all of the descendents)
        function allDescendants (node, node_depth, contentString) {
          node.childNodes.forEach(child => {
            var element = child.parentNode.nodeName;
            if(element != 'SCRIPT' && element != 'NOSCRIPT' && element != 'STYLE') //avoid adding a bunch of script and style elements
            {
              if(child.nodeType == Node.TEXT_NODE){ //only add entries with text in them
                var text = child.textContent;
                if (/[^\s]/m.test(text)) //only add entries with visible text in them
                {
                  
                  rendered_text = text;

                  //text_nodes.push({level: node_depth, element: element, text: rendered_text});
                  
                  //add spaces to seperate text elements if they aren't adjacent text nodes (seperated by elemental boundry)
                  if (!child.previousSibling)
                  {
                    contentString += ' ';
                  }
                  contentString += rendered_text;
                }
              }
            };
            contentString = allDescendants(child, node_depth + 1, contentString); //first go to the depest decendant
          });
          return contentString;
        }

        //text_nodes_concatenated = getNodeContent(document.documentElement);
        var head = getNodeContent(document.head);
        var body = getNodeContent(document.body);
        

        text_nodes = 
        {
          id: null,
          address: null,
          head: head,
          body: body
        };
        return text_nodes;
    }
    return ready();

  });
  
  var timestamp = Date.now();

  text_nodes.id = timestamp,
  text_nodes.address = address;
  return text_nodes;
};