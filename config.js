const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoib0RwMmUydk1GNW52NWVBRUxGNEJOb3o4YTFqM3EvYjN1ekcxby9Gb0hYOD0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoicTFwVml1NEtpR29XYUNaVUNxOXIrdTJXZmVlbEloenZJdUMvM3hYSDRRVT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJvSXZIWE5waFlOa01xc1ludHZxNitoZTJDNXIvMEd1OHhxeTFvNlBFcldJPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJWVXJ2VGE1dFh4VzdPL3FValdYalUvYlFRd2VldlBjR2JDRHVUNi9YVFZFPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Ik9PTlFJVnhVdUNtRGFzRDduY2p3Zm9IQWw0MitDSFdmYWZBYktLUVJSRUE9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkdZZ29MYkhickRWeE1taDJTZzd2WGl3Qkl0bmIwU2lTZEg2Yk1Bajh6aVU9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMk5PVHhKYVJEcW9Vam1abmRXZ3dMTGN1RnNaMlEvMFRBMG81ZFZoVzVrQT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiNjNGMmdNVlVxSFAvY1BrMjNXQTFnd0M1MVJIOUczbXdqMnozM05XdU9BUT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjBDYUlQaURZZVAxQmlRUXA2NUZUYXNuM3kyUzZnS1JWNW9PNkJsWWg2b2l0YWxDWGZVWVAyNmpxakZsRDRKd3l5ZUhEWUNkdlk0MHhqa3ljMUorS0NRPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjAxLCJhZHZTZWNyZXRLZXkiOiJLN241K3J4dGNtUDlrUWVNSEpiOXMxdk5sTzFTYU0wMFZLRlNXeXlENmQwPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJCSjRXTVpHWSIsIm1lIjp7ImlkIjoiOTQ3MjUzMzc4MDY6NjFAcy53aGF0c2FwcC5uZXQiLCJsaWQiOiI0OTAyMzMyNzE3NDY3OTo2MUBsaWQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0pQZnIrc0NFSXlVcWRRR0dBSWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6Ik5IUGZBVjNjRFpubW00d2N0bVVUamNpVlB1T0RydWNNeTEzdUNaL1lDaVE9IiwiYWNjb3VudFNpZ25hdHVyZSI6IjRIRU1PNE84d3hwODhrc1ZQWDNwTXNXc21LQldrWHd4N2I3WGsxbjIrdW5hN3RKWWNzbkJZS1lVL2p3TGFXWXpPY2owZG9oYWpBSWRnZnB2c2hzOEFnPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJSWlJkUVY5VTVEM3hnSk5xY0sra0szZmdwU0p3MlhGak5SRURyVmNQVGRLWUNpVldsbFFSblN4bDIrVzRucm41RnBwelNNdmg0Y0o4ZU1pckUybjVEUT09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6Ijk0NzI1MzM3ODA2OjYxQHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQlRSejN3RmQzQTJaNXB1TUhMWmxFNDNJbFQ3amc2N25ETXRkN2dtZjJBb2sifX1dLCJwbGF0Zm9ybSI6ImFuZHJvaWQiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBMElCUWdTIn0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc4NzQ0NzgzMCwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFMbU8ifQ",

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
