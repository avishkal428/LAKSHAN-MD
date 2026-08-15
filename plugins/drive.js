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

        let downloadData = null;

        // Source 1: Dark-Yasiya GDrive API (100% Free & Fast)
        try {
            const res = await axios.get(`https://www.dark-yasiya-api.site/download/gdrive?url=${encodeURIComponent(gLink)}`, { timeout: 15000 });
            if (res.data?.status && res.data?.result) {
                const r = res.data.result;
                downloadData = {
                    downloadUrl: r.dl_url || r.downloadUrl,
                    fileName: r.fileName || r.name || "GDrive_File",
                    fileSize: r.fileSize || r.size || "Unknown",
                    mimetype: r.mimetype || r.mimeType || "application/octet-stream"
                };
            }
        } catch (e) { /* fallback */ }

        // Source 2: BK9 GDrive API (Backup)
        if (!downloadData) {
            try {
                const res = await axios.get(`https://bk9.fun/download/gdrive?url=${encodeURIComponent(gLink)}`, { timeout: 15000 });
                if (res.data?.status && res.data?.BK9) {
                    const r = res.data.BK9;
                    downloadData = {
                        downloadUrl: r.dl_url,
                        fileName: r.fileName || "GDrive_File",
                        fileSize: r.fileSize || "Unknown",
                        mimetype: r.mimetype || "application/octet-stream"
                    };
                }
            } catch (e) { /* both failed */ }
        }

        if (!downloadData || !downloadData.downloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } });
            return reply('❌ *ᴜɴᴀʙʟᴇ ᴛᴏ ꜰᴇᴛᴄʜ ꜰɪʟᴇ. ᴍᴀᴋᴇ sᴜʀᴇ ᴛʜᴇ ʟɪɴᴋ ɪs ᴘᴜʙʟɪᴄ!*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
        }

        const { downloadUrl, fileName, fileSize, mimetype } = downloadData;

        // CYBER GRID PANEL
        const infoMsg = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ɢ-ᴅʀɪᴠᴇ ᴄᴏʀᴇ 」*

┌───────────────────┐
  📂 *ꜰɪʟᴇ:* ${fileName}
  📏 *sɪᴢᴇ:* ${fileSize}
  📡 *ᴛʏᴘᴇ:* ${mimetype}
└───────────────────┘
> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

        const context = {
            mentionedJid: [sender],
            forwardingScore: 0,
            isForwarded: false
        };

        // Automatic Media Router
        if (mimetype.startsWith('image')) {
            await conn.sendMessage(from, { image: { url: downloadUrl }, caption: infoMsg, contextInfo: context }, { quoted: mek });
        } else if (mimetype.startsWith('video')) {
            await conn.sendMessage(from, { video: { url: downloadUrl }, caption: infoMsg, contextInfo: context }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                document: { url: downloadUrl }, 
                mimetype, 
                fileName, 
                caption: infoMsg, 
                contextInfo: context 
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: reactKey } });

    } catch (error) {
        console.error(error);
        reply('❌ *ᴅᴏᴡɴʟᴏᴀᴅ ᴘʀᴏᴛᴏᴄᴏʟ ꜰᴀɪʟᴇᴅ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
    }
});

