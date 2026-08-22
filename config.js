const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiRUhFbG1sTjlFaXJNcXBqM3RrWFYveXZMNjQzVjBidjFnY1ltTWVxVmIwOD0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoialRJSkZXWTBiVjVpK050RFNPdkxDUXlhM05FZVFoRnNtRmx6bUlQNTFuQT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIyS1UzSWgwRSs1R1NLYVdlMVA1MnN6d0dkZFl0czZDQlFBNTVWMXFlaVg0PSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJoYVZXMlNXM3NuRCtJOGNKWXYwMmhhbEorZHdzdGFvZXh2eVVBdzYyQ1dJPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IndMZzc1SlZKTXZubVk0WUg0SU5MejY2azBWdnArTUxKbzN3Sm5yMmJxV2c9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InBqQ0d6VWhIenFpaEppaTM0S3ZBNXoyTGxqWFRxY0RDYldFU3A0MGhtM2M9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiVVBwZUpTeHlJSnU2MDhsT1ZwMHNqb1FMMHdpd3ozOXJoeWxSczBZRFRGdz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiSWltaXhkajVGTHRtVVd3WlBvdk5EVG9KcmdlT1pranJVUXN5UmJRRkRRND0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InJ0L3RoTWFDZ0hiRDNVM3NnZWtEL2hHTkpqRXpHbG1GM3ZISDNjNDVidk5xMzdEOEcrR3o1Wk5EZUhBYnV1MmxzbmxEblNndmxic0I2d1JnZE9ZTmd3PT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjQ1LCJhZHZTZWNyZXRLZXkiOiIwcHpPYURvaVgwZDlBQ2VsMFJhNGJxR3c2UUd6ZmFsTTNEQ21QQ3Npd2swPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJGRFhINjNOWCIsIm1lIjp7ImlkIjoiOTQ3MjUzMzc4MDY6NjBAcy53aGF0c2FwcC5uZXQiLCJsaWQiOiI0OTAyMzMyNzE3NDY3OTo2MEBsaWQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0pQZnIrc0NFUHk0cHRRR0dBRWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6Ik5IUGZBVjNjRFpubW00d2N0bVVUamNpVlB1T0RydWNNeTEzdUNaL1lDaVE9IiwiYWNjb3VudFNpZ25hdHVyZSI6IlJPUDd1VklrVWRSZ3RFTUpJVWJHdElxTFE3em1sYmlIUVhZWWFVdGdGUmVnOUQ4bmR5N1o0TEVlc1RSMm1wc21JY01ma1czeFdvSjF4aEJKdGVmSkRnPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJtWDNkQTdKQzM2MWwzQTZWL2E0Myt1TXE1OWxzTHZ6cjF5K0lBRzFnRkNwNWpWNnV3RmpDNC9rTkg0aEYxY3NXQ2NWWUR5M290QjkrN3cwdDBKRkpqUT09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6Ijk0NzI1MzM3ODA2OjYwQHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQlRSejN3RmQzQTJaNXB1TUhMWmxFNDNJbFQ3amc2N25ETXRkN2dtZjJBb2sifX1dLCJwbGF0Zm9ybSI6ImFuZHJvaWQiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBMElCUWdTIn0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc4NzQwMzM5OCwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFMbU8ifQ",

    // Bot & Owner Details
    BOT_NAME: process.env.BOT_NAME || "𝐋𝐀Kb𝐒𝐇𝐀𝐍-𝐌𝐃",
    PREFIX: process.env.PREFIX || ".",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "94725337806",
    OWNER_NUM: process.env.OWNER_NUM || "94725337806",
    OWNER_NAME: process.env.OWNER_NAME || "Lakshan",
    MODE: process.env.MODE || "public",

    // Images & Messages
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/uqofdi.jpg",
    ALIVE_MSG: process.env.ALIVE_MSG || "I'm Alive Now",
    MENU_IMG: process.env.MENU_IMG || "https://files.catbox.moe/lkvdvv.jpg",
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/uqofdi.jpg",
    MENU_MSG: process.env.MENU_MSG || "I'm MENU Now",

    // API Keys
    MOVIE_API_KEY: process.env.API_KEY || "sky|2483faa7f5630311464123d017fc7acc2aec6da0",

    // System Settings (Default True/False Switches)
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "true",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    AUTO_TYPING: process.env.AUTO_TYPING || "false",
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",
    AUTO_REPLY: process.env.AUTO_REPLY || "false",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    AUTO_STICKER: process.env.AUTO_STICKER || "false",
    AUTO_VOICE: process.env.AUTO_VOICE || "false",
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    ANTI_LINK: process.env.ANTI_LINK || "true",
    ANTI_BAD: process.env.ANTI_BAD || "false",
    ANTI_DELETE: process.env.ANTI_DELETE || "true"
};
