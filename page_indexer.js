const test_page = 'http://0.0.0.0:8000/archive/1605905557.655183/blog.self.li/post/16366939413/how-to-convert-bookmarklet-to-chrome-extension.html';
//const test_page = 'http://0.0.0.0:8000/archive/1605904857.309566/developer.android.com/studio/install.html';

const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    "args": [
      "--remote-debugging-port=9222",
      '--remote-debugging-address=0.0.0.0'
    ],
    "headless": false,
    "devtools": true,

  });
  const page = await browser.newPage();
  await page.goto(test_page);
  
  function describe(jsHandle) {
    return jsHandle.executionContext().evaluate(obj => {
      // serialize |obj| however you want
      return JSON.stringify(obj);
    }, jsHandle);
  }
  
  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(arg => describe(arg)));
    console.log(msg.text(), ...args);
  });

  const text_nodes = await page.evaluate(() => {
    function ready() {
        var text_nodes = [] //[{level, element, text},...]
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
        

        text_nodes.push({page_content: 
        {
          head: head,
          body: body
        }});
        return text_nodes;
    }
    return ready();

  });
  

  console.log(text_nodes);
  fs.writeFile('pagedata.json', JSON.stringify(text_nodes), function (err) {
  });

  //await browser.close();
})();