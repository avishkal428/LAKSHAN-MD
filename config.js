const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "2K52XApQ#ARfPvFWg6dMG8gQs3FXn8fnyzhSGjFfhST1YdyhxnPo",
ALIVE_IMG: process.env.ALIVE_IMG || "https://biakk-pissek4.hf.space/api/stream/secure/6a38af067006dd1c80422eb7/moviehub%20dl%20moviebot.jpg",
ALIVE_MS: process.env.ALIVE_MSG || "I'm Alive Now",
MOVIE_API_KEY: process.env.API_KEY || "sky|2483faa7f5630311464123d017fc7acc2aec6da0",
};
