import crypto from 'crypto';
// var crypto = require("crypto");

export default async function(){
    return await new Promise(async(resolve, reject) => {
        //Function to get random integer
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min); 
          }
     
         var randomLength = await getRandomInt(20,50); //RandomLength to feed the crypto.randomBytes length
         var randomString = await crypto.randomBytes(randomLength).toString('base64'); //Create a random Function name
         if (!!randomString){
             resolve(randomString);
         }
         else {
             reject();
         }
    });

}