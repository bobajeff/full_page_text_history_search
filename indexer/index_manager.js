export default async function () {
    //INITIALISE INDEX
    let index; //TODO

    global.app.events.on('text_updated', handle_incomming_document_data);
    async function handle_incomming_document_data(document_data){
        console.log(document_data);
        //FORMAT DATA FOR INDEX
        //SEND DATA TO INDEX
    }
}