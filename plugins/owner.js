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
        // Fallback values (config එකේ නැත්නම් default values ගනී)
        const ownerNumber = config.OWNER_NUMBER || "94725337806"; 
        const ownerName = config.OWNER_NAME || "LAKSHAN";     

        // Number Clean Up (Numbers විතරක් ඉතිරි කරගැනීම)
        const cleanNumber = ownerNumber.replace(/[^0-9]/g, '');

        // Reaction Safe Key
        const reactKey = m?.key || mek.key;
        await conn.sendMessage(from, { react: { text: '👑', key: reactKey } });

        // Create Official vCard
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${ownerName}\n` +  
                      `ORG:𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 ᴅᴇᴠᴇʟᴏᴘᴇʀ;\n` +
                      `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n` + 
                      'END:VCARD';

        // 1. Send the vCard Contact
        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: mek });

        // 2. Cyber-Grid Detail Panel
        const ownerPanel = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ᴏᴡɴᴇʀ ᴅᴇᴛᴀɪʟs 」*

┌───────────────────┐
  👤 *ɴᴀᴍᴇ:* ${ownerName}
  📞 *ɴᴜᴍʙᴇʀ:* +${cleanNumber}
  ⚙️ *sᴛᴀᴛᴜs:* ᴅᴇᴠᴇʟᴏᴘᴇʀ
  🚀 *ᴠᴇʀsɪᴏɴ:* 2.0.0 ʙᴇᴛᴀ
└───────────────────┘

> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

        // 2. Send Image with Context Details
        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/lkvdvv.jpg' }, 
            caption: ownerPanel,
            contextInfo: {
                mentionedJid: [sender, `${cleanNumber}@s.whatsapp.net`], 
                forwardingScore: 0,
                isForwarded: false,
                externalAdReply: {
                    title: `ᴄᴏɴᴛᴀᴄᴛ: ${ownerName}`,
                    body: "𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 ᴏꜰꜰɪᴄɪᴀʟ ᴅᴇᴠᴇʟᴏᴘᴇʀ",
                    mediaType: 1,
                    thumbnailUrl: 'https://files.catbox.moe/lkvdvv.jpg',
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

