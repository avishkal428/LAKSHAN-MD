const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "SNsBWBLa#Y6yyecDex3CcRz1E0QVcmsApKgLIMqdSvo1aW65QZhM",
ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/lkvdvv.jpg",
ALIVE_MS: process.env.ALIVE_MSG || "I'm Alive Now",
};
