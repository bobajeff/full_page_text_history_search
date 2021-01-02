import configuration from './configuration.js';
var responses_json = undefined;
async function change_date_for_response(){
    const {default: responses_js} = await import('./response.js');
    const date = new Date().toUTCString();
    var responses_json_ = responses_js;
    var process_date = [];
    for (let path in responses_json_)
    {
        process_date.push(
            (async(path)=>{
                responses_json_[path].responseHeaders.filter((obj, index) => {
                    if (obj.name == "Date")
                    {
                        responses_json_[path].responseHeaders[index].value = date;
                    }
                });
            })(path)
        );
    }
    await Promise.all(process_date);
    
    return responses_json_;
}

const host = configuration.history_page_host;
export default async function (cdp) {
    responses_json = !!responses_json ? responses_json : await change_date_for_response();
    
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