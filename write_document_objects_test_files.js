import {default as fs} from 'fs';
// import {promises as fs} from 'fs';
import {md5} from 'hash-wasm';

const dir = 'test_files/arrays/';
const writestreams = {};
export default async function (document_data) {
  return new Promise(async(resolve)=>{
  if (!writestreams[document_data.set_id])
  {
    writestreams[document_data.set_id] = await fs.createWriteStream(dir + await md5(document_data.address) + '.array', {flags: 'a', encoding: 'utf8'});
  }
  
  writestreams[document_data.set_id].write(JSON.stringify(document_data).toString() + '\n');
  resolve();
  

  // fs.writeFile(dir + await md5(document_data.address) + '.array', JSON.stringify(document_data).toString(), 'utf8', function(err) {
  //     if (err) {
  //         console.log(err);
  //       return;
  //     }
  // });

});

}