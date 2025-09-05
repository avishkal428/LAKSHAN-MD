const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "OYF02aTI#aEAuHpnjl94_PZVlXsdM1sxtPXRSeTRuBK7wOb-InXo",
ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/lkvdvv.jpg",
ALIVE_MS: process.env.ALIVE_MSG || "I'm Alive Now",
};
