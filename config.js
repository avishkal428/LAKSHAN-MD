const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiK05HYVp2RjUveVdDdklUUWJZa3FMbDB0KzUyb3ZVZnQvZmVJMklPVE5tYz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoid1FxQWR5cDRucURVU1RWWEduNWFPVGFlazZSemViQVdmelZXY252SVVpQT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJHTG5zcEpFdzRqOEtUNnBVZktMTDdCbG1HVzc2Z0JSc3dQQXpSZ01DRGtjPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJiTGl2SjU3ckFUbktYMXpRUUlwV3FDRWZRN0pwUXZrcStvcXV0QmlKY2lZPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IllORlN6dWdMRWg2VUYxQ1pVRjFSNVdtUSt3aEl0TS92V1BMbHBkOWs1bkU9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InZZYzY2VTk5NUNRd3J1TnNVaGMzNjUzbkNPbkhCTHRRMDZqL0JCUGF2ekU9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiSURIOU9VaEE4WnZjaUZINWF6ZFlPNnVFTEFqWCtqYXkrbDlzTnFMdlpFbz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiM1VDYWVoMzV5ZmZTaXJkZ2hOclQvbm1qai9zVERxSTg5N1lWeXZnbkN4VT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IllUYTBrK2hKMUMyU1k2VTg3R2d1UWUwT2VhUnJXNUtWZTExQi9nQ2dENFNuZkw2MjFZRlFGeWk0K0w0Qkg0UWtwT2d2RVdiblpQMUNReHpPeXRoQmhnPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjA4LCJhZHZTZWNyZXRLZXkiOiJxY01QTi9kLzVQVGh4MG1FRHhKdkhHbjRhTXc3cVZ2UVBMclZHcEtKS1prPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJWQjhONVRMRCIsIm1lIjp7ImlkIjoiOTQ3MjUzMzc4MDY6NTRAcy53aGF0c2FwcC5uZXQiLCJsaWQiOiI0OTAyMzMyNzE3NDY3OTo1NEBsaWQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0k3ZnIrc0NFTHVLZzlRR0dBSWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6Ik5IUGZBVjNjRFpubW00d2N0bVVUamNpVlB1T0RydWNNeTEzdUNaL1lDaVE9IiwiYWNjb3VudFNpZ25hdHVyZSI6ImxPdS8wOGJSMllEM0lhWEtKNEt0NEhUL2ZsMHcvUjY2czdqZlhYR1h1S2s5eFFaK09oMVE4Znljb1hmY2RTVFhtb3JpdGcrR2h3b0k3eW5NeWRNYkNBPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJ1MnU5d0RoOHVBZUp5ZFhpclRMR2tQTWp6YU9ROG91NVE5MHJGbnNCOW5LM1JjMjhIL3Fpd1pTRmYzTitKYUJQOWhwTER2Z0dJUkNicjFLeXdzNjlqZz09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6Ijk0NzI1MzM3ODA2OjU0QHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQlRSejN3RmQzQTJaNXB1TUhMWmxFNDNJbFQ3amc2N25ETXRkN2dtZjJBb2sifX1dLCJwbGF0Zm9ybSI6ImFuZHJvaWQiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBMElCUWdTIn0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc4NjgyNDAwNCwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFFejgifQ",

    // Bot & Owner Details
    BOT_NAME: process.env.BOT_NAME || "𝐋𝐀Kb𝐒𝐇𝐀𝐍-𝐌𝐃",
    PREFIX: process.env.PREFIX || ".",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "94725337806",
    OWNER_NUM: process.env.OWNER_NUM || "94725337806",
    OWNER_NAME: process.env.OWNER_NAME || "Lakshan",
    MODE: process.env.MODE || "public",

    // Images & Messages
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/lkvdvv.jpg",
    ALIVE_MSG: process.env.ALIVE_MSG || "I'm Alive Now",
    MENU_IMG: process.env.MENU_IMG || "https://files.catbox.moe/lkvdvv.jpg",
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/lkvdvv.jpg",
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
