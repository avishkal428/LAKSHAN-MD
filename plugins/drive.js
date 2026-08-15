const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "gdrive",
    alias: ["gd", "drive"],
    react: "📥",
    desc: "Download GDrive Files",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, args, reply}) => {
    try {
        if (!args[0]) return reply("❌ කරුණාකර Google Drive Link එකක් ලබාදෙන්න.");

        reply("⏳ Link එක Processing වෙමින් පවතී...");

        // GDrive Direct Download Link එක ලබාගැනීමට Free API එකක් භාවිත කිරීම
        const apiUrl = `https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(args[0])}&apikey=fg-api`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.result || !res.data.result.downloadUrl) {
            return reply("❌ File එක සොයාගැනීමට නොහැකි විය. Permission 'Anyone with link' ලබාදී ඇත්දැයි බලන්න.");
        }

        const fileData = res.data.result;
        reply(`📦 *File Name:* ${fileData.fileName}\n⚖️ *Size:* ${fileData.fileSize}\n\n⏳ Upload වෙමින් පවතී...`);

        // Direct Download Link එක හරහා Document එක Send කිරීම
        await conn.sendMessage(from, { 
            document: { url: fileData.downloadUrl }, 
            mimetype: fileData.mimetype || 'application/octet-stream', 
            fileName: fileData.fileName || 'GDrive_File.zip' 
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ දෝෂයක් සිදු විය: ${e.message}`);
    }
});
