const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiVUU2Z0ZKRm1VTGxaTlcrMFF2OFVOOGNTaXFBRDVDV1FJdzErUlVJZU9XMD0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMUNJSjFTdVg2U2tobXVSY1MxY2ZVY1IrMUJ1WSsrZ1lmMUJwc1UrYlNtVT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJpTkZ5NlpmU3l0NFhoSGZDZFIyVmNMTHAyK2FROVZuNUpqU0xPdmpGZ1VNPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJjMS9WcVdROHg1ZWlyVGQyVTlYaE9GNDV5ZWVkeG5XbExVc2Z0VUIyOFVNPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InNLVGFGVjZHVzRnT1VHaHBHNTlwNS9VYlQ1bnNaSitqSlBFQ1dDU0o2Mnc9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IlIyeUFhcmNXOWN2czhyN1RmYUhmcXJUQWZKclcrMWFNTWRTc1pjYWMvUWc9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiK0hIc1dqa2t6dzVYTkxGYzlTd2FiSDBrZ2ZkRVdESlRZREc3TzBmR2ZsUT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMDgyK3Zid2VIMW1XdjJDb3BpOGdrdG4veGR6QkRGRkZyYllPMStRWXBrND0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IlNFdlpIRGhPSm1yU014ZU1heUYyeE1wTlBOSVZBOC82QmJYeTJIWldmeG9VblJHMVFManBsVWxUTUY3M1ljSFl1MVExNWhjbHloSWxIRnlmU0dtMkN3PT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjYsImFkdlNlY3JldEtleSI6IlVzS0RhZEZTYmlHb0s0SFFaZmFlTkh3ZEFiUy9lRnA0cGp4Y2lFTXAvaXM9IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbXSwibmV4dFByZUtleUlkIjozMSwiZmlyc3RVbnVwbG9hZGVkUHJlS2V5SWQiOjMxLCJhY2NvdW50U3luY0NvdW50ZXIiOjAsImFjY291bnRTZXR0aW5ncyI6eyJ1bmFyY2hpdmVDaGF0cyI6ZmFsc2V9LCJyZWdpc3RlcmVkIjp0cnVlLCJwYWlyaW5nQ29kZSI6IjNDOU1CNzZaIiwibWUiOnsiaWQiOiI5NDcyNTMzNzgwNjo1NkBzLndoYXRzYXBwLm5ldCIsImxpZCI6IjQ5MDIzMzI3MTc0Njc5OjU2QGxpZCJ9LCJhY2NvdW50Ijp7ImRldGFpbHMiOiJDSS9mcitzQ0VML3pqTlFHR0FFZ0FDZ0EiLCJhY2NvdW50U2lnbmF0dXJlS2V5IjoiTkhQZkFWM2NEWm5tbTR3Y3RtVVRqY2lWUHVPRHJ1Y015MTN1Q1ovWUNpUT0iLCJhY2NvdW50U2lnbmF0dXJlIjoiQ3U0ckxTaFZacnFsMDVBRnpkaXl5cXJKK1pWa1Rkem1NUHIwQUN5bUdNWUtPcDhDMlRlYzlRbDBLOG14cmkwWWxnQ0cvc1ZVVUpONDd1cVZaYUM1REE9PSIsImRldmljZVNpZ25hdHVyZSI6IlpDOWhpMjJacVdJSEJQeklsMlBxZEpXQmM2ZzJzZnRneVpEcTRveWxuVVFIY0RGenpDQXFnVUVmRXovTVVDRDgzaU5aQStTeHkxaUM5R21vNy9kaUNRPT0ifSwic2lnbmFsSWRlbnRpdGllcyI6W3siaWRlbnRpZmllciI6eyJuYW1lIjoiOTQ3MjUzMzc4MDY6NTZAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCVFJ6M3dGZDNBMlo1cHVNSExabEU0M0lsVDdqZzY3bkRNdGQ3Z21mMkFvayJ9fV0sInBsYXRmb3JtIjoiYW5kcm9pZCIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0EwSUJRZ1MifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzg2OTg0OTA1LCJteUFwcFN0YXRlS2V5SWQiOiJBQUFBQUMwbiJ9",

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
