const axios = require('axios');
const cheerio = require('cheerio');

// Google Drive Link එකෙන් Direct Download Link එක ලබාගන්නා Function එක
async function getGDriveLink(url) {
    try {
        const idMatch = url.match(/(?:d\/|id=)([a-zA-Z0-9_-]+)/);
        if (!idMatch) return null;
        const fileId = idMatch[1];
        
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const res = await axios.get(downloadUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' } 
        });

        // ලොකු ෆයිල් වල Virus Scan Confirmation එක Bypass කිරීම
        if (res.data.includes('confirm=')) {
            const $ = cheerio.load(res.data);
            const confirmUrl = $('a#uc-download-link').attr('href');
            return confirmUrl ? `https://drive.google.com${confirmUrl}` : downloadUrl;
        }

        return downloadUrl;
    } catch (error) {
        console.error("GDrive Error:", error);
        return null;
    }
}

// WhatsApp Bot Command Handler
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
        
        reply("⏳ File එක download වෙමින් පවතී, මදක් රැඳී සිටින්න...");
        
        const directLink = await getGDriveLink(args[0]);
        if (!directLink) return reply("❌ Direct Download Link එක සාදා ගැනීමට නොහැකි විය. Permission පරීක්ෂා කරන්න.");

        // Direct File එක Download කර WhatsApp එකට Upload කිරීම
        await conn.sendMessage(from, { 
            document: { url: directLink }, 
            mimetype: 'application/octet-stream', 
            fileName: 'GDrive_File.zip' 
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`❌ දෝෂයක් සිදු විය: ${e.message}`);
    }
});
