var http = require('http');

var webSocketDebuggerUrl = "";


//'http://127.0.0.1:9222/json/version'
var options = {
    host: '127.0.0.1',
    port: '9222',
    path: '/json/version'
};



module.exports = async function() {
    return await new Promise((resolve, reject) => {
        http.request(options, (response) =>{
            var str = '';
            var json;
            
            response.on('data', function (chunk) {
                str += chunk;
            });
            
            response.on('end', function () {
                json = JSON.parse(str); //convert string to json
                webSocketDebuggerUrl = json.webSocketDebuggerUrl; //get webSocketDebuggerUrl value from json object
                resolve(webSocketDebuggerUrl);
            });
            
            response.on('abort', function () {
                reject(0);
            });
        
            response.on('timeout', function () {
                reject(0);
            });
        }).end();
    });
};