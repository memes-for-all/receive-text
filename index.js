'use strict';

const twilio = require('twilio');
const config = require('./config.json');

const MessagingResponse = twilio.twiml.MessagingResponse;

const projectId = process.env.GCLOUD_PROJECT;
const region = 'us-central1';


var admin = require("firebase-admin");

var serviceAccount = config.SERVICE_API_KEY;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://memesforall-100af.firebaseio.com"
});

const db = admin.database()

const output_message = (name, nameOfServe, hoursTilMeme) => (
    `Hello ${name},
Welcome to ${nameOfServe}. Your next meme will drop in ${hoursTilMeme} hrs.
For a list of actions type '/list'
- an intellectual  
`
)

const regeration_message = (name) => (
    `Hello ${name},
you seem not to be an intellectual. Ask an intellectual how to subscribe...
- an intellectual`
)

exports.reply = (req, res) => {
    let isValid = true;
    // Only validate that requests came from Twilio when the function has been
    // deployed to production.
    if (process.env.NODE_ENV === 'production') {
        isValid = twilio.validateExpressRequest(req, config.TWILIO_AUTH_TOKEN, {
            url: `https://${region}-${projectId}.cloudfunctions.net/reply`
        });
    }

    // Halt early if the request was not sent from Twilio
    if (!isValid) {
        res
            .type('text/plain')
            .status(403)
            .send('Twilio Request Validation Failed.')
            .end();
        return;
    }

    // Prepare a response to the SMS message
    const response = new MessagingResponse();
    const userContents = req.body;
    const userMessage = userContents.Body;
    // Add text to the response
    const cleanedMess = userMessage.toLowerCase()
    db.ref('users/').child(userContents.From).once('value', function (snapshot) {
    }).then((data) => {
        const user = data.toJSON()
        
        if (user !== undefined) { // user exist
            if (cleanedMess === '/list') {
                response.message(`Welcome back ${user.preferedName},\n /setName [name] - will set the name of what I call you`);
            }
            else if(cleanedMess.startsWith('/setname')){
                const newName = userMessage.split('/setname')[1].trim();
                if (newName.length > 0){
                db
                .ref('users/')
                .child(userContents.From)
                .child('preferedName')
                .set(newName)
                    
                response.message(`Sweet your name is now ${newName}`)
                }
                else{
                    response.message("You have to enter a name, try again")
                }
            }
            else{
                const mess = ` Hello ${user.preferedName},\nEven though I am an intellectual, I didn't understand your request\n - love an intellectual ❤️`
                 response.message(mess)
            }
        }
        else {
            if (cleanedMess === 'send dank memes') {
                db.ref('users/').child(userContents.From).set(
                    {
                        sendDanks: true,
                        subscribtion: [],
                        frequncyOfMemes: 1,
                        memesRating: 0,
                        preferedName: userContents.From
                    })
                response.message(output_message(userContents.From, "Meme for All", 9));
            }
            else {
                response.message(regeration_message(userContents.From));
            }
        }

        // Send the response
        res
            .status(200)
            .type('text/xml')
            .end(response.toString());


    })
};