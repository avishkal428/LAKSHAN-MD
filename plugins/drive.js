const { cmd } = require('../command');
const axios = require('axios');

// GDrive File ID එක වෙන් කරගන්නා Function එක
function getGDriveId(url) {
    const match = url.match(/(?:d\/|id=)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

cmd({
    pattern: "gdrive",
    alias: ["gd", "drive"],
    react: "📥",
    desc: "Download Google Drive Files",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, args, reply}) => {
    try {
        if (!args[0]) return reply("❌ කරුණාකර Google Drive Link එකක් ලබාදෙන්න.");

        const fileId = getGDriveId(args[0]);
        if (!fileId) return reply("❌ වලංගු Google Drive Link එකක් නොවේ.");

        reply("⏳ File එක Download වෙමින් පවතී, මදක් රැඳී සිටින්න...");

        // Direct Download Link
        const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

        // WhatsApp එකට Direct File Stream එකක් ලෙස Send කිරීම
        await conn.sendMessage(from, { 
            document: { url: downloadUrl }, 
            mimetype: 'application/octet-stream', 
            fileName: `GDrive_File_${fileId.substring(0, 5)}.zip` 
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ දෝෂයක් සිදු විය: ${e.message}`);
    }
});
