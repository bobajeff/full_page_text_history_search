import {promises as fs, constants as fs_constants} from 'fs';
import configuration from './configuration.js';

const host = configuration.history_page_host;
export default async function (cdp) {
    const date = new Date().toISOString();
    var responses_json = await fs.readFile('response.json', {encoding: 'utf8'}).catch(reason=>{});
    if (!responses_json)
    {
        //Diagnose the issue and provide feedback if we can't read responses_json
        var file = 'response.json';
        fs.access(file, fs_constants.F_OK | fs_constants.R_OK).catch((err)=>{
              if (err)
              {
                  if (err.code == 'EACCES')
                  {
                      console.log('\nLooks like we\'re not allowed to read ' + file + '.\nYou may need to change the permissions on it.');
                  }
                  else if (err.code == 'ENOENT')
                  {
                      console.log('\n' + file + " does not exist. \nYou probably need to run:\n\tnode generate_response_json.js");
                  }
                  else
                  {
                    console.log('*** Something is wrong with ' + file + ' ***');
                  }
              }
              else
              {
                console.log('*** Something is wrong with ' + file + ' ***');
              }
          });
    }
    else
    {
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

}