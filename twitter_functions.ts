import * as functions from 'firebase-functions';
import * as twitter from 'twitter';
const request = require('request');
const fs = require('fs');
const path = require('path');
const os = require('os');

// // Start writing Firebase Functions
// // https://firebase.google.com/functions/write-firebase-functions
//

export const writeToTwitter = functions.database.ref('twitter/{key}/downloadUrl')
.onCreate(async event => {
    const downloadUrl = event.data.val();
    const before = await event.data.ref.parent.child('before').once('value');
    const after = await event.data.ref.parent.child('after').once('value');
    const newstatus = `Before:\n${before.val()}\nAfter:\n${after.val()}`;
    const client = new twitter({
        consumer_key: functions.config().twitter.consumer_key,
        consumer_secret: functions.config().twitter.consumer_secret,
        access_token_key: functions.config().twitter.access_token_key,
        access_token_secret: functions.config().twitter.access_token_secret
      });
      console.log(client);
      console.log(client.post.toString());
    const directory = 'beforeafter.jpg'
    const fileName = path.basename(directory);
    const tempLocalFile = path.join(os.tmpdir(), fileName);
    // Load your image
    await download(downloadUrl, tempLocalFile);
    const data = require('fs').readFileSync(tempLocalFile);
    // Make post request on media endpoint. Pass file data as media parameter
    const media = await client.post('media/upload', {media: data});
    // If successful, a media object will be returned.
    console.log(media);

    // Lets tweet it
    const status = {
        screen_name: 'b_and_a_bot',
        status: newstatus,
        media_ids: media.media_id_string // Pass the media id string
    };

    const tweet = await client.post('statuses/update', status);
    console.log(tweet);
});

// Generic download function
async function download(uri, filename){
    return new Promise(function (resolve, reject) { 
        request.head(uri, function(err, res, body){
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function () {
                resolve();
            });
        })
   })
}
