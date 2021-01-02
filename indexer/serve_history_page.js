import {promises as fs} from 'fs';
import configuration from './configuration.js';

const host = configuration.history_page_host;
export default async function (cdp) {
    const date = new Date().toISOString();
    var responses_json = await fs.readFile('response.json', {encoding: 'utf8'}).catch(reason=>{});
    responses_json = responses_json.replace(/\[REPLACE_WITH_DATE_STRING\]/gm, date);
    responses_json = JSON.parse(responses_json);

    cdp.send('Fetch.enable', {patterns: [
        {
            urlPattern: host + '*',
            requestStage: "Request"
        }
    ]});
    
    //Send previusly retrieved data
    cdp.on('Fetch.requestPaused', async ({requestId, request, frameId, resourceType, responseErrorReason, responseStatusCode, responseHeaders, networkId})=>{
        let path = request.url.replace(host, '');
        console.log(path);
        var response_obj = undefined;
        if (!!responses_json[path])
        {
            response_obj = responses_json[path];
        }
        else if (request.url == host || request.url == "manifest.json")
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