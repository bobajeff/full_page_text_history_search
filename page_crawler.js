const fs = require('fs');
const EventEmitter = require('events');
class LoggerEmitter extends EventEmitter {}

const puppeteer_utilies = require('./init_puppeteer.js');

loggerEvents = new LoggerEmitter();

var getPageJson = async function (page) {
    return page.evaluate(()=>{
    function ready() {
        var pageJson; // {id , address, head, body}

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
                  //add spaces to seperate text elements if they aren't adjacent text nodes (seperated by elemental boundry)
                  if (!child.previousSibling)
                  {
                    contentString += ' ';
                  }
                  contentString += text;
                }
              }
            };
            contentString = allDescendants(child, node_depth + 1, contentString); //first go to the depest decendant
          });
          return contentString;
        }

        var timestamp = Date.now();
        var address = window.location.href;
        var head = getNodeContent(document.head);
        var body = getNodeContent(document.body);
        

        pageJson = 
        {
          id: timestamp,
          address: address,
          head: head,
          body: body
        };
        return pageJson;
    }
    return ready();
})
}

logDocuments = async function() {
const {browser, page} = await puppeteer_utilies.startPuppeteerSession();

//Get json object of page content
global._meilisearch_documents = []

//Get all the new pages opened in puppeteer
browser.on('targetcreated', async(target) => {
  if (target.type() === 'page') {
    var newpage = await target.page();
    newpage.on('load', async () => {
      global._meilisearch_documents.push(await getPageJson(newpage));
      loggerEvents.emit('document_created');
    })
  }
});

//Get the first page from starting puppeteer
page.on('load', async () => {
  global._meilisearch_documents.push(await getPageJson(page));
  loggerEvents.emit('document_created');
})
global.pages_logged = 0;
loggerEvents.on('document_created', () => {
  global.pages_logged++;
  if (global.pages_logged > 5)
  {
    loggerEvents.emit('documents_added');
    global.pages_logged = 0;
  }
});

setTimeout(() => {
  if (global.pages_logged > 0 ){
    loggerEvents.emit('documents_added');
    global.pages_logged = 0;
  }
}, 120000)

//When browser closed do something with documents array

browser.on('disconnected', async () => {
  loggerEvents.emit('documents_added');
  global.pages_logged = 0;
}) 

loggerEvents.emit('pageready', page);
//await browser.close();
};

module.exports = { loggerEvents, logDocuments};