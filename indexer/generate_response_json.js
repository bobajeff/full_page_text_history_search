import {promises as fs} from 'fs';
import { md5 } from 'hash-wasm';

async function generateEtag(data){
    let hash = await md5(data);
    return '"'+hash+'"';
}

function createResponseHeaderTemplate(){
    return {
        content_disposition: {
          name: "Content-Disposition",
          value: undefined,
        },
        accept_ranges: {
          name: "Accept-Ranges",
          value: "bytes",
        },
        etag: {
          name: "ETag",
          value: undefined,
        },
        content_type: {
          name: "Content-Type",
          value: undefined,
        },
        vary: {
          name: "Vary",
          value: "Accept-Encoding",
        },
        content_encoding: {
          name: "Content-Encoding",
          value: "gzip",
        },
        date: {
          name: "Date",
          value: "[REPLACE_WITH_DATE_STRING]",
        },
        connection: {
          name: "Connection",
          value: "keep-alive",
        },
        keep_alive: {
          name: "Keep-Alive",
          value: "timeout=5",
        },
        transfer_encoding: {
          name: "Transfer-Encoding",
          value: "chunked",
        },
        content_length: {
          name: "Content-Length",
          value: undefined,
        }
    };
}

async function generate_response_json() {

var tasks = [];
var routes = {};
const base_dir = '../history_page/build/';
const static_js_dir = 'static/js/';

//all the js files in static directory
{
  let filelist = await fs.readdir( base_dir + static_js_dir,'utf8');
  for (let filename of filelist)
  {
    tasks.push(
      (async(filename)=>{
          const map = /\.map$/.test(filename);
          const js = /\.js$/.test(filename);
          let path = static_js_dir + filename;
          routes[path] = {"requestId": undefined, "responseCode": 200,};
          routes[path].body = await fs.readFile(base_dir + path, {encoding: 'base64'}).catch(reason=>{});
          let {content_disposition, accept_ranges, etag, content_type, vary, content_encoding, date, connection, keep_alive, transfer_encoding} = createResponseHeaderTemplate();
          content_disposition.value = 'inline; filename="' + filename + '"';
          etag.value = await generateEtag(routes[path].body);
          if (js) //check if file ends in .map
          {
              content_type.value = "application/javascript; charset=utf-8";
          }
          else if (map)
          {
              content_type.value = "application/json; charset=utf-8";
          }
          else //don't create a responce for files that aren't js or map files
          {
              return;
          }
          routes[path].responseHeaders = [content_disposition, accept_ranges, etag, content_type, vary, content_encoding, date, connection, keep_alive, transfer_encoding];
          return;
      })(filename)
    );
  }
}

const static_css_dir = 'static/css/';
//all the css files in static directory
{
  let filelist = await fs.readdir(base_dir + static_css_dir);
  for (let filename of filelist)
  {
    tasks.push(
      (async(filename)=>{
          const map = /\.map$/.test(filename);
          const css = /\.css$/.test(filename);
          let path = static_css_dir + filename;
          routes[path] = {"requestId": undefined, "responseCode": 200};
          routes[path].body = await fs.readFile(base_dir + path, {encoding: 'base64'}).catch(reason=>{});
          let {content_length, content_disposition, accept_ranges, etag, content_type, vary, date, connection, keep_alive} = createResponseHeaderTemplate();
          content_length.value =  Buffer.byteLength(routes[path].body).toString();
          content_disposition.value = 'inline; filename="' + filename + '"';
          etag.value = await generateEtag(routes[path].body);
          if (css) //check if file ends in .map
          {
              //
              content_type.value = "text/css; charset=utf-8";
              routes[path].responseHeaders = [date, content_length, content_disposition, accept_ranges, etag, content_type, vary];
          }
          else if (map) //check if file ends in .map
          {
              content_type.value = "application/json; charset=utf-8";
              routes[path].responseHeaders = [content_length, content_disposition, accept_ranges, etag, content_type, vary, date, connection, keep_alive];
          }
          //don't create a responce for files that aren't css or map files
          return;
      })(filename)
    );
  }
}


//Favicon
tasks.push(
  (async()=>{
      let filename = 'baseline_history_black_48dp.png';
      let path = filename;
      routes[path] = {"requestId": undefined, "responseCode": 200};
      routes[path].body = await fs.readFile(base_dir + path, {encoding: 'base64'}).catch(reason=>{});
      let {content_length, content_disposition, accept_ranges, etag, content_type, date, connection, keep_alive} = createResponseHeaderTemplate();
      content_length.value =  Buffer.byteLength(routes[path].body).toString();
      content_disposition.value = 'inline; filename="' + filename + '"';
      etag.value = await generateEtag(routes[path].body);
      content_type.value = "image/png";
      routes[path].responseHeaders = [content_length, content_disposition, accept_ranges, etag, content_type, date, connection, keep_alive];
      return;
  })()
);

//Index.html
tasks.push(
  (async()=>{
      let filename = 'index.html';
      let path = filename;
      routes[path] = {"requestId": undefined, "responseCode": 200};
      routes[path].body = await fs.readFile(base_dir + path, {encoding: 'base64'}).catch(reason=>{});
      let {content_disposition, accept_ranges, etag, content_type, vary, content_encoding, date, connection, keep_alive, transfer_encoding} = createResponseHeaderTemplate();
      content_disposition.value = 'inline; filename="' + filename + '"';
      etag.value = await generateEtag(routes[path].body);
      content_type.value = "text/html; charset=utf-8";
      routes[path].responseHeaders = [content_disposition, accept_ranges, etag, content_type, vary, content_encoding, date, connection, keep_alive, transfer_encoding];
      return;
  })()
);

await Promise.all(tasks);
//Test
// var res_data = JSON.stringify(routes);
// var new_res = res_data.replace(/\[REPLACE_WITH_DATE_STRING\]/gm, "");
// fs.writeFile('response.json', new_res, "utf-8");

fs.writeFile('response.json', JSON.stringify(routes), "utf-8");
}

// export default generate_response_json;
generate_response_json();
