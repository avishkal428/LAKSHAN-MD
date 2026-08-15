const axios = require('axios');

// File ID එක වෙන් කරගන්නා Function එක
function extractFileId(url) {
    const match = url.match(/(?:d\/|id=)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Google Drive Direct Buffer/Stream Downloader
async function downloadGDriveFile(fileId) {
    try {
        // Direct Download endpoint එක
        const url = `https://drive.google.com/uc?id=${fileId}&export=download`;
        
        // Initial Request
        let res = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        // ලොකු ෆයිල් වල confirmation cookie සෙවීම
        const cookie = res.headers['set-cookie'];
        const htmlContent = res.data.toString('utf-8');

        if (htmlContent.includes('confirm=')) {
            const confirmToken = htmlContent.match(/confirm=([a-zA-Z0-9_-]+)/)?.[1];
            if (confirmToken) {
                res = await axios.get(`${url}&confirm=${confirmToken}`, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Cookie': cookie,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });
            }
        }

        return res.data; // File Buffer එක
    } catch (error) {
        console.error("Download Error:", error.message);
        return null;
    }
}

// Command Handler
cmd({
    pattern: "gdrive",
    alias: ["gd"],
    react: "📥",
    desc: "Download GDrive Files",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, args, reply}) => {
    try {
        if (!args[0]) return reply("❌ කරුණාකර Google Drive Link එකක් ලබාදෙන්න.");

        const fileId = extractFileId(args[0]);
        if (!fileId) return reply("❌ වලංගු Google Drive Link එකක් නොවේ.");

        reply("⏳ File එක Download වෙමින් පවතී...");

        const fileBuffer = await downloadGDriveFile(fileId);
        
        if (!fileBuffer) {
            return reply("❌ File එක Download කර ගැනීමට නොහැකි විය. Permission (Anyone with link) ලබාදී ඇත්දැයි බලන්න.");
        }

        // WhatsApp එකට Send කිරීම
        await conn.sendMessage(from, { 
            document: fileBuffer, 
            mimetype: 'application/zip', 
            fileName: `GDrive_File_${fileId.substring(0, 5)}.zip` 
        }, { quoted: mek });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});
