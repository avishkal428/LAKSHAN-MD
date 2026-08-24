const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    // Session Information
    SESSION_ID: process.env.SESSION_ID || "LKSHAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQUpBWU5vd2tIRzhwRGhWQlJZSEhRRjZNeDhlMk0yYldSMjZhZ1J6MFJHZz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiWHNCTXBiSDFHWkRSU0JaeHhXUnUxdU9CY3dpR2loR3MyaEpxbzVPc21CRT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIrQy8zS1lkUjFzNzFOUWNUR0JjUEhtbkp0ZmM2YU5rbjNVL25mbFRGZm5RPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJHT0lYcGswUmx4bStQRk1XRlAzU0VjamhRekl0b215V2taWk0xcmp1YUMwPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkFPdnVDV1JlZmx0d3FGUG5aaVZEbnVsS21hLzR6MHcwUVNDbXF1U05PbFE9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjBEOGI5NjNEc0ZBWmZIZlM3ZjcvWUdtVmcreW5TWFVGV2M0b0R2V2NDbms9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoia0NKUGNLamthK2wxMDhJczhmQ2IrUEUvTE83MnljRzRvdmdzQ3JPckRuZz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiY2F3MmlSRUxXaVljcTBYMDkwRks2aWI0Vm5aUVd3Y05QMXBsTnA4QzRWTT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IndzdEdWTVJoZW9ybXYvM2NrWmhEcFZmVzE4aWkrd2kwOFpwLzd2dFU1WUZZSHpVOHkxczd1S084MzdIamFpcVJna0gvUVg5NUN5U3NpV1hWaXRuMUFBPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6ODMsImFkdlNlY3JldEtleSI6ImF6VmZEOXVUdS83Tkdnb2xVMkNTbDdnV1FRT3BLV083TnVmUmFDa3pPUjA9IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbXSwibmV4dFByZUtleUlkIjozMSwiZmlyc3RVbnVwbG9hZGVkUHJlS2V5SWQiOjMxLCJhY2NvdW50U3luY0NvdW50ZXIiOjAsImFjY291bnRTZXR0aW5ncyI6eyJ1bmFyY2hpdmVDaGF0cyI6ZmFsc2V9LCJyZWdpc3RlcmVkIjp0cnVlLCJwYWlyaW5nQ29kZSI6Ik40UTdZRzlMIiwibWUiOnsiaWQiOiI5NDcyNTMzNzgwNjo2NEBzLndoYXRzYXBwLm5ldCIsImxpZCI6IjQ5MDIzMzI3MTc0Njc5OjY0QGxpZCJ9LCJhY2NvdW50Ijp7ImRldGFpbHMiOiJDSmJmcitzQ0VNS1VzTlFHR0FFZ0FDZ0EiLCJhY2NvdW50U2lnbmF0dXJlS2V5IjoiTkhQZkFWM2NEWm5tbTR3Y3RtVVRqY2lWUHVPRHJ1Y015MTN1Q1ovWUNpUT0iLCJhY2NvdW50U2lnbmF0dXJlIjoiU3NtUDJMMUpYMXp1Y05URklNRnVQZnowYXIyVmhvRXRSbHlXR0FReGR6TkdOMWQwYWtlSlNLTDNKaVgrekM3WURtZS9GdWcrMHMya1RoVUNBZy9mRGc9PSIsImRldmljZVNpZ25hdHVyZSI6IktOSU5FOUZJS2QzdkxVei82dmVuZDlZUTBQcHVYc3Z0UGNhaldvQkZYd1lkd0psZ25VeXZKZzJZKzF5b1VpTnlMcU1ILzZiMzhTT0d4R2xFRi9kL0RBPT0ifSwic2lnbmFsSWRlbnRpdGllcyI6W3siaWRlbnRpZmllciI6eyJuYW1lIjoiOTQ3MjUzMzc4MDY6NjRAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCVFJ6M3dGZDNBMlo1cHVNSExabEU0M0lsVDdqZzY3bkRNdGQ3Z21mMkFvayJ9fV0sInBsYXRmb3JtIjoiYW5kcm9pZCIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0EwSUJRZ1MifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzg3NTYyNTcyLCJteUFwcFN0YXRlS2V5SWQiOiJBQUFBQUlPaiJ9",

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
