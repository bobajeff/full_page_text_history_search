import configuration from './configuration.js';
import generate_response_json, {createResponseHeaderTemplate, generateEtag} from './generate_response_json.js';
import {default as fs, promises, constants} from 'fs';
var responses_json = undefined;
var response_jsfile_exists = false;

async function set_responses_json(){
    //generate response.js if it doesn't exist
    response_jsfile_exists = !!response_jsfile_exists ? response_jsfile_exists : await check_for_responsejs_file();
    //import response.js
    const {default: responses_js} = await import('./response.js');
    var responses_json_ = responses_js;
    //set apikey response
    {
        let filename = 'key.json';
        let path = filename;
        responses_json_[path] = {"requestId": undefined, "responseCode": 200};
        responses_json_[path].body = Buffer.from(JSON.stringify({apiKey: configuration.meilisearch.searchkey})).toString("base64");
        let {content_disposition, accept_ranges, etag, content_type, vary, content_encoding, date, connection, keep_alive, transfer_encoding} = createResponseHeaderTemplate();
        content_disposition.value = 'inline; filename="' + filename + '"';
        etag.value = await generateEtag(responses_json_[path].body);
        content_type.value = "application/json; charset=utf-8";
        responses_json_[path].responseHeaders = [content_disposition, accept_ranges, etag, content_type, vary, content_encoding, date, connection, keep_alive, transfer_encoding];
    }
    //update the date strings
    const date = new Date().toUTCString();
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

async function check_for_responsejs_file(){
    await promises.access(global.app.dirname + '/response.js', constants.F_OK).catch(async()=>{
        await generate_response_json();
    });
    return true;
}

const host = configuration.history_page_host;
export default async function (cdp) {
    responses_json = !!responses_json ? responses_json : await set_responses_json();
    
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