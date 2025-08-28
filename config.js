const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "qNVmjByA#DeLddohIzfsWbZedFgqFNdh-eUm2AQunDIODW0RVjwU",
ALIVE_IMG: process.env.ALIVE_IMG || "https://raw.githubusercontent.com/Manju362/Link-gamu./refs/heads/main/IMG-20250408-WA0003.jpg",
ALIVE_MS: process.env.ALIVE_MSG || "I'm Alive Now",
};
