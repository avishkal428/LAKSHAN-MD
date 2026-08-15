const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "owner",
    alias: ["developer", "dev"],
    react: "👑", 
    desc: "Get owner contact details",
    category: "main",
    filename: __filename
}, 
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const ownerNumber = config.OWNER_NUMBER || "94725337806"; 
        const ownerName = config.OWNER_NAME || "LAKSHAN";     

        const cleanNumber = ownerNumber.replace(/[^0-9]/g, '');

        const reactKey = m?.key || mek.key;
        await conn.sendMessage(from, { react: { text: '👑', key: reactKey } });

        const ownerImg = 'https://files.catbox.moe/uqofdi.jpg';

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${ownerName}\n` +  
                      `ORG:𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 ᴅᴇᴠᴇʟᴏᴘᴇʀ;\n` +
                      `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n` + 
                      'END:VCARD';

        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: mek });

        const ownerPanel = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ᴏᴡɴᴇʀ ᴅᴇᴛᴀɪʟs 」*

┌───────────────────┐
  👤 *ɴᴀᴍᴇ:* ${ownerName}
  📞 *ɴᴜᴍʙᴇʀ:* +${cleanNumber}
  ⚙️ *sᴛᴀᴛᴜs:* ᴅᴇᴠᴇʟᴏᴘᴇʀ
  🚀 *ᴠᴇʀsɪᴏɴ:* 2.0.0 ʙᴇᴛᴀ
└───────────────────┘

> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

        await conn.sendMessage(from, {
            image: { url: ownerImg }, 
            caption: ownerPanel,
            contextInfo: {
                mentionedJid: [sender, `${cleanNumber}@s.whatsapp.net`], 
                forwardingScore: 0,
                isForwarded: false,
                externalAdReply: {
                    title: `ᴄᴏɴᴛᴀᴄᴛ: ${ownerName}`,
                    body: "𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 ᴏꜰꜰɪᴄɪᴀʟ ᴅᴇᴠᴇʟᴏᴘᴇʀ",
                    mediaType: 1,
                    thumbnailUrl: ownerImg,
                    sourceUrl: `https://wa.me/${cleanNumber}`,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply(`❌ *ᴇʀʀᴏʀ:* ${error.message}\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`);
    }
});
