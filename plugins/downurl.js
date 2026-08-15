const { cmd, commands } = require('../command');
const axios = require("axios");

cmd({
    pattern: "download",
    alias: ["downurl"],
    use: ".download <link>",
    react: "⏳",
    desc: "Download file from direct link",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply("⚠️ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ ᴅɪʀᴇᴄᴛ ʟɪɴᴋ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*");
        }

        const link = q.trim();
        const urlPattern = /^(https?:\/\/[^\s]+)/i;
        
        if (!urlPattern.test(link)) {
            return reply("❌ *ɪɴᴠᴀʟɪᴅ ᴜʀʟ ꜰᴏʀᴍᴀᴛ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*");
        }

        // Fetching metadata safely with fallback GET
        let contentType = "application/octet-stream";
        let sizeMB = "Unknown Size";

        try {
            const head = await axios.get(link, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                responseType: 'stream' 
            });
            contentType = head.headers['content-type'] || contentType;
            const sizeBytes = head.headers['content-length'];
            if (sizeBytes) sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2) + " MB";
        } catch (e) {
            // Server එකෙන් head/get block කරත් download එක continue වෙන්න දෙන්න
        }

        const fileExt = contentType.split('/')[1]?.split(';')[0]?.toUpperCase() || 'DATA';

        // --- CYBER GRID INFO ---
        const infoMsg = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ᴜʀʟ ꜰᴇᴛᴄʜᴇʀ 」*

┌───────────────────┐
  📂 *ꜰᴏʀᴍᴀᴛ:* ${fileExt}
  📦 *sɪᴢᴇ:* ${sizeMB}
  🔗 *sᴛᴀᴛᴜs:* ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...
└───────────────────┘
> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

        await reply(infoMsg);

        // Send file as document
        await conn.sendMessage(from, {
            document: { url: link },
            mimetype: contentType,
            fileName: `𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃_FILE.${fileExt.toLowerCase()}`,
            caption: `*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 0,
                isForwarded: false
            }
        }, { quoted: mek });

        // Reaction fix: m.key වෙනුවට mek.key භාවිතය
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error(err);
        reply(`❌ *Failed to download file.*\n\n*ᴀᴋɪɴᴅᴜ-ᴍᴅ*`);
    }
});

