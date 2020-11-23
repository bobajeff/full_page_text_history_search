const puppeteer_utilies = require('./init_puppeteer.js');

(async () => {
var browser = await puppeteer_utilies.startPuppeteerSession();

//Get json object of page content
var getPageJson = async function (page) {
    return page.evaluate(()=>{
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
})
}
var documents = []

//Get all the new pages opened in puppeteer
browser.on('targetcreated', async(target) => {
  if (target.type() === 'page') {
    var page = await target.page();
    page.on('load', async () => {
      documents.push(await getPageJson(page));
    })
  }
});

//Get the first page from starting puppeteer
const page = (await browser.pages())[0];
page.on('load', async () => {
  documents.push(await getPageJson(page));
})

//When browser closed do something with documents array
browser.on('disconnected', async () => {
  console.log(documents);
})
//await browser.close();
})();