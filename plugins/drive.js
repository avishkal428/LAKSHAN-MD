const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "gdrive",
    alias: ["gd", "drive"],
    react: '📥',
    desc: "Download files from Google Drive.",
    category: "download",
    use: ".gdrive <url>",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, q, sender }) => {
    try {
        const gLink = q || args[0];
        if (!gLink || !gLink.includes("drive.google.com")) {
            return reply('⚠️ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ ɢᴏᴏɢʟᴇ ᴅʀɪᴠᴇ ᴜʀʟ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
        }

        const reactKey = m?.key || mek.key;
        await conn.sendMessage(from, { react: { text: '⏳', key: reactKey } });

        // Extract File ID from Google Drive URL
        const idMatch = gLink.match(/\/d\/([a-zA-Z0-9_-]+)/) || gLink.match(/id=([a-zA-Z0-9_-]+)/);
        const fileId = idMatch ? idMatch[1] : null;

        let downloadData = null;

        // Method 1: Direct Google Drive Download (Using File ID)
        if (fileId) {
            downloadData = {
                downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
                fileName: `GDrive_File_${fileId.substring(0, 5)}.zip`,
                fileSize: "Public File",
                mimetype: "application/octet-stream"
            };
        }

        // Method 2: Fallback Scraper API (In case File ID extraction fails)
        if (!downloadData) {
            try {
                const res = await axios.get(`https://api.guruapi.tech/gdrive?url=${encodeURIComponent(gLink)}`, { timeout: 15000 });
                if (res.data?.downloadUrl) {
                    downloadData = {
                        downloadUrl: res.data.downloadUrl,
                        fileName: res.data.fileName || "GDrive_File",
                        fileSize: res.data.fileSize || "Unknown",
                        mimetype: res.data.mimetype || "application/octet-stream"
                    };
                }
            } catch (e) { /* fallback */ }
        }

        if (!downloadData || !downloadData.downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } });
            return reply('❌ *ᴜɴᴀʙʟᴇ ᴛᴏ ꜰᴇᴛᴄʜ ꜰɪʟᴇ. ᴍᴀᴋᴇ sᴜʀᴇ ᴛʜᴇ ʟɪɴᴋ ɪs ᴘᴜʙʟɪᴄ! (Anyone with the link can view)*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
        }

        const { downloadUrl, fileName, fileSize, mimetype } = downloadData;

        // CYBER GRID PANEL
        const infoMsg = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ɢ-ᴅʀɪᴠᴇ ᴄᴏʀᴇ 」*

┌───────────────────┐
  📂 *ꜰɪʟᴇ:* ${fileName}
  📏 *sɪᴢᴇ:* ${fileSize}
└───────────────────┘
> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

        const context = {
            mentionedJid: [sender],
            forwardingScore: 0,
            isForwarded: false
        };

        // Send Document
        await conn.sendMessage(from, { 
            document: { url: downloadUrl }, 
            mimetype: mimetype, 
            fileName: fileName, 
            caption: infoMsg, 
            contextInfo: context 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: reactKey } });

    } catch (error) {
        console.error(error);
        reply('❌ *ᴅᴏᴡɴʟᴏᴀᴅ ᴘʀᴏᴛᴏᴄᴏʟ ꜰᴀɪʟᴇᴅ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
    }
});
