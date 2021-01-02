import configuration from './configuration.js';
import responses_json from './response.js';
const date = new Date().toISOString();

async function change_date_for_response(responses_json){
    date_operation = ()=>{};
    var process_date = [];
    for (let path in responses_json)
    {
        console.log(path);
        process_date.push(
            (async(path)=>{
                responses_json[path].responseHeaders.filter((name, index) => {
                    if (name == "Date")
                    {
                        responses_json[path].responseHeaders[index].value = date;
                    }
                });
            })(path)
        );
    }
    await Promise.all(process_date);
    return responses_json;
}

var date_operation = change_date_for_response;

const host = configuration.history_page_host;
export default async function (cdp) {
    date_operation(responses_json);
    
    cdp.send('Fetch.enable', {patterns: [
        {
            urlPattern: host + '*',
            requestStage: "Request"
        }
    ]});
    
    //Send previusly retrieved data
    cdp.on('Fetch.requestPaused', async ({requestId, request, frameId, resourceType, responseErrorReason, responseStatusCode, responseHeaders, networkId})=>{
        let path = request.url.replace(host, '');
        console.log(path);//DEBUG
        var response_obj = undefined;
        if (!!responses_json[path])
        {
            response_obj = responses_json[path];
        }
        else if (request.url == host || request.url == host + "manifest.json")
        {
            response_obj = responses_json['index.html'];
        }
        else
        {
            response_obj = {
                "requestId":requestId,
                "responseCode":404,
            };
        }
        response_obj.requestId = requestId;

        await cdp.send('Fetch.fulfillRequest', response_obj);

    });

}