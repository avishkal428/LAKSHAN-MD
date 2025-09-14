const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "DNdQxZRb#TyY6vsCiGoaQhtFTYNp36yNH-G7RASs8wCGoweuNNkM",
ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/lkvdvv.jpg",
ALIVE_MS: process.env.ALIVE_MSG || "I'm Alive Now",
MOVIE_API_KEY: process.env.API_KEY || "sky|2483faa7f5630311464123d017fc7acc2aec6da0",
};
