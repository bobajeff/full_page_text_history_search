const fs = require('fs');
const fsPromises = fs.promises;
const url = require('url');
const forward_slash_at_beginning_or_end_of_string = /(^\/)|(\/$)/g; //regex to match forward slash at beginning or end of string
const write_interval = 20000; //20 seconds 

module.exports = async function () {
    var write_queue = [];
    var queue_checker_is_on = false;
    var write_timer;
    
    global.app.events.on('text_updated', async (document) => {
        if (!write_queue.includes(document)) //don't add duplicates to the write queue 
        {
            write_queue.push(document);
            if(!queue_checker_is_on){
                check_queue();
            }
        }
    } );
    
    async function write_data(){
        //prevent loop from writing the same document again if it's added after removal
        var loop_itrations_left = write_queue.length; //any documents added after this is set will not be written

        while (loop_itrations_left > 0)
        {
            var document = write_queue.shift(); //remove first item in array
            loop_itrations_left--; //reduce iteration

            let data = document;
            let data_directory = await create_data_directory(document);

            if (!!data.screenshot_data){ //add screenshot if it exists
                let screenshot_path = data_directory + '/' + 'screenshot.png';
                document.screenshot_path = screenshot_path;
                fs.writeFile(screenshot_path, data.screenshot_data, function (err) {
                    if (err) return console.log(err);
                });
            }
            //write data to file;
            console.log(data);
        }
        if (write_queue == 0) //turn on que
        {
            clearInterval(write_timer);
            queue_checker_is_on = false;
        }
    }

    async function check_queue(){
        queue_checker_is_on = true;
        write_timer = setInterval(write_data, write_interval);
    }

    async function create_data_directory(document){
        return await new Promise(async(resolve, reject) => {
            let timestamp = document.timestamp;
            let address = document.address;
            let address_obj = await url.parse(address);
            let {hostname, pathname, search, hash} = address_obj;
    
            pathname = await pathname.replace(forward_slash_at_beginning_or_end_of_string,'');    //make sure pathname doesn't begin or end in a forward slash
            let data_directory = './data/site_data/' + hostname + '/' + timestamp + '/' + pathname;
            data_directory = search ? data_directory + '/' + search : data_directory;
            data_directory = hash ? data_directory + '/' + hash : data_directory;
            
            await fsPromises.access(data_directory, fs.constants.F_OK)
            .catch(async() => {
              await fs.mkdir(data_directory, { recursive: true }, function(err) {
                if (err) {
                  console.log(err)
                  reject(err);
                } else {
                    resolve(data_directory);
                }
              })
            });
        })
    }
}