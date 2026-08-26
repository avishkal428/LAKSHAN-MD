const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiS0FOREd4bGxvVW41SEVpeFNWQURPUlIwU09jSGNCc3d3aUxjK01LSVFIZz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiUG90WjVSTlNqMUxqU3dzeWhGMW5BK3VEUCtPV2ZNUGthamQrZUNDNm0zTT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIwS1JPTXdoUW5BbE1LVm9LM1ViZ0ZVS245VHpTOE9GMVdXSGIzSnlTQm04PSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJOd1pkVVVoalBzYThnR21TV2k1MzFDeHpqTmNaZUtFbzFxbkI4T0JVRlhRPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IlNJZEpLMVc2QkFJYzJmR285MnlIUTZKdDVCSUhWd0loTjFJcTlNNkM1VjA9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Ik9ZakdjYVdkczJlc0dGcnF3R2U0Zmd4L1dXLzhTZWhjTDhvK3lMK080R0E9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoia0ZyaithaSt5ODdIWk1xbHJlWWNKSlFGTEwwUWdrMW5laVZWbDdBQjBVQT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMWNYWlhuSHpKemVUNWkvV0Z6bzRXSitXcWd5NlRjTFNJM3FQQjFaZC9tRT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InlTMmo0aThMSWJBczJ0ZEJNVHNwREluc0RGVW9HRDB2akorTEYwdDlSYUI0MnZNRFFoc3dwcXFwN0M3RU9tZW5kUVdJL0FPVTdPT3VtdCtsSTQyNkJRPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MTA2LCJhZHZTZWNyZXRLZXkiOiJJNFhLT2NocFBTVFl4Zk1sc1B1WmZUc2NXQ2ZpZ1ptRXJ3dU8rUklNYzBvPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiI3UFNMWlhHUCIsIm1lIjp7ImlkIjoiOTQ3MjUzMzc4MDY6NjZAcy53aGF0c2FwcC5uZXQiLCJsaWQiOiI0OTAyMzMyNzE3NDY3OTo2NkBsaWQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0pqZnIrc0NFTHovdTlRR0dBRWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6Ik5IUGZBVjNjRFpubW00d2N0bVVUamNpVlB1T0RydWNNeTEzdUNaL1lDaVE9IiwiYWNjb3VudFNpZ25hdHVyZSI6IldpQWQvbkxIdXJySTcwWlBMWDBjRVNtN1UrODdYa2FBT1M1cnUrQXp3Ujg3UGdVTHNFT2dJTDZrcTBkMiswdko3REV2b1RQK213YjNnMGhRY2c3dkRnPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJuVWFDSkVqUGQ5Rjl6ZmlaWmpYTVM0cjJwNzhJdEt5TmRBd1hLeU5EY241TW0xd1Q0dlQ5QnAyYnd6Q3hKTlAxdWRNb09nYzRLRG5GQnRWZFdQMVJBUT09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6Ijk0NzI1MzM3ODA2OjY2QHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQlRSejN3RmQzQTJaNXB1TUhMWmxFNDNJbFQ3amc2N25ETXRkN2dtZjJBb2sifX1dLCJwbGF0Zm9ybSI6ImFuZHJvaWQiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBMElCUWdTIn0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc4Nzc1NjQ4NiwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFITlQifQ",

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
