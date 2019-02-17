'use strict';

const twilio = require('twilio');
const config = require('./config.json');

const MessagingResponse = twilio.twiml.MessagingResponse;

const projectId = process.env.GCLOUD_PROJECT;
const region = 'us-central1';

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
    console.log(req.body);
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
  if (userMessage.toLowerCase() === 'send dank memes')
    response.message(output_message(userContents.From, "Meme for All", 9));
    else {
    response.message(regeration_message(userContents.From));
    }

  // Send the response
  res
    .status(200)
    .type('text/xml')
    .end(response.toString());
};