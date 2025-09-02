const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "SNsBWBLa#Y6yyecDex3CcRz1E0QVcmsApKgLIMqdSvo1aW65QZhM",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/avishkal428/Lakshan-md-bot/blob/4c46edeef90f8530f3c2cc8088c415388cb648d9/IMG-20250807-WA0075.jpg",
ALIVE_MS: process.env.ALIVE_MSG || "I'm Alive Now",
};
