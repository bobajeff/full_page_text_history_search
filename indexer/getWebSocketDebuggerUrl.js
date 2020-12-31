import http from 'http';

var webSocketDebuggerUrl = "";


//'http://127.0.0.1:9222/json/version'
var options = {
    host: '127.0.0.1',
    port: '9222',
    path: '/json/version'
};



export default async function() {
    return await new Promise((resolve, reject) => {
        var request = http.request(options, (response, error) =>{
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
                console.log('[abort event]')
                reject(0);
            });
        
            response.on('timeout', function () {
                console.log('[timeout event]');
                reject(0);
            });
        }).end();

        request.on('error', (err) => {
            console.log(err);
            if (err.toString().match(/ECONNREFUSED 127.0.0.1:9222/))
            {
                console.log('\n\n** Looks like you forgot to run your Browser with the --remote-debugging-port=9222 flag. **');
            }
        } );
    });
};