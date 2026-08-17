const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiOEFFTTV2aUEvdDc1OFJtTG1SN294V0t6ejY0Rms2RlpVR0VRWlgyN1AwYz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiS2F0LzdhYmpNVVJHeHhBR2srRHBZdzNLUWZGWmlPVVkzd3crdU1LZTZ6WT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIySkJzbXFkblBjeDYzcUJCMXFVTmU4dEVQd0pTZFVLVVJ3eVpML05iUlU0PSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJRVEh1Q3c5TU1rUFFLbWVTWmlXYklVYW5EeUVwZXFGZDd3RkZFb0VUOW4wPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InNJZ3duVTk5K2thVlM1V2NmemRyOWo3dWlnaWpqWmFzYVpORDRrd3NxRWM9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InFaT0hLRkdrNHBiYUtUa3Q5WUcrOFM0czQ1ZWxYa3VNRURBdmVRT3VSMGM9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiR0dIbS8yOUdLY0pPWnVzYldmR0VuVVU3a2FGelk3VnJITTc0aGtUeGwyaz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoicnV2aDh3RXozc0RsWk9pQzRuREJFaGJPdDFxR3lUbHZ2NDRjeUh3ejBqOD0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InN0dG9YaFNtOVBtU1QvVEM1YjI0S2hGdHBYU2p2cVJSU0p2QklzalYxNTA5bWIrcTR4V29RNzVzclJoRW53cjVhOHphWlNvcjBEUHkvSXNzNjFtNUR3PT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MTA2LCJhZHZTZWNyZXRLZXkiOiJIQTlNajNtSFJQUXdUMHVEZjNOejgzYXZlREd2RUhrekc4WUR6M2RpeE1jPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJYRVhOR0dYQiIsIm1lIjp7ImlkIjoiOTQ3MjUzMzc4MDY6NTVAcy53aGF0c2FwcC5uZXQiLCJsaWQiOiI0OTAyMzMyNzE3NDY3OTo1NUBsaWQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0k3ZnIrc0NFTkNzaTlRR0dBTWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6Ik5IUGZBVjNjRFpubW00d2N0bVVUamNpVlB1T0RydWNNeTEzdUNaL1lDaVE9IiwiYWNjb3VudFNpZ25hdHVyZSI6IktXQVpyZndsaXE2amhwRWxlT1dXMU1JcjVib09jSmFwOVpwSW9hRlRZRFRpK2FRMmlBSWQ3ZVRiMWJJSzNqZXM1SmROb1lpblV5eC9vUnRYUHkwT0RRPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJtNUl2a2J5c1Zpd2NEckRQK0hKeDIvZ1ZyNGNPcWVjSDlaMUdQZHBKU0dXMjBKejdnN2FGZjhoKzU1MTdteldZMW5KM2p0bTV0aGFkeDN6b0IrNjZEdz09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6Ijk0NzI1MzM3ODA2OjU1QHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQlRSejN3RmQzQTJaNXB1TUhMWmxFNDNJbFQ3amc2N25ETXRkN2dtZjJBb2sifX1dLCJwbGF0Zm9ybSI6ImFuZHJvaWQiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBMElCUWdTIn0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc4Njk1OTQ0OSwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFFejgifQ",

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
