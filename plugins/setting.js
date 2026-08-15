const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "setting",
    alias: ["settings", "env", "config"],
    desc: "Show all bot configuration variables (Owner Only)",
    category: "system",
    react: "⚙️",
    filename: __filename
}, 
async (conn, mek, m, { from, reply, isCreator, sender }) => {
    try {
        // Direct Owner Number Check (sender අංකය පරීක්ෂා කිරීම)
        const ownerNumbers = ['94725337806', config.OWNER_NUMBER, config.OWNER_NUM];
        const senderNumber = sender.split('@')[0];
        const isOwner = isCreator || ownerNumbers.includes(senderNumber);

        if (!isOwner) {
            return reply("🚫 *ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ!*");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const isEnabled = (value) => value && value.toString().toLowerCase() === "true";
        const menuImg = config.MENU_IMAGE_URL || config.MENU_IMG || 'https://files.catbox.moe/lkvdvv.jpg';

        let settingsPanel = `
*「 ʟᴀᴋsʜᴀɴ-ᴍᴅ : sʏsᴛᴇᴍ sᴇᴛᴛɪɴɢs 」*

┌───────────────────┐
  🤖 *ʙᴏᴛ ɪɴꜰᴏ*
  • ɴᴀᴍᴇ: ${config.BOT_NAME || '𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃'}
  • ᴘʀᴇꜰɪx: [ ${config.PREFIX || '.'} ]
  • ᴏᴡɴᴇʀ: ${config.OWNER_NAME || 'Lakshan'}
  • ᴍᴏᴅᴇ: ${(config.MODE || 'public').toUpperCase()}
└───────────────────┘

┌───────────────────┐
  ⚙️ *ᴄᴏʀᴇ ᴄᴏɴꜰɪɢ*
  • ᴘᴜʙʟɪᴄ ᴍᴏᴅᴇ: ${isEnabled(config.PUBLIC_MODE) ? "✅" : "❌"}
  • ᴀʟᴡᴀʏs ᴏɴʟɪɴᴇ: ${isEnabled(config.ALWAYS_ONLINE) ? "✅" : "❌"}
  • ʀᴇᴀᴅ ᴍsɢs: ${isEnabled(config.READ_MESSAGE) ? "✅" : "❌"}
  • ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ: ${isEnabled(config.AUTO_TYPING) ? "✅" : "❌"}
  • ᴀᴜᴛᴏ ʀᴇᴄᴏʀᴅ: ${isEnabled(config.AUTO_RECORDING) ? "✅" : "❌"}
└───────────────────┘

┌───────────────────┐
  🔌 *ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ*
  • ᴀᴜᴛᴏ ʀᴇᴘʟʏ: ${isEnabled(config.AUTO_REPLY) ? "✅" : "❌"}
  • ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ: ${isEnabled(config.AUTO_REACT) ? "✅" : "❌"}
  • ᴀᴜᴛᴏ sᴛɪᴄᴋᴇʀ: ${isEnabled(config.AUTO_STICKER) ? "✅" : "❌"}
  • ᴀᴜᴛᴏ ᴠᴏɪᴄᴇ: ${isEnabled(config.AUTO_VOICE) ? "✅" : "❌"}
└───────────────────┘

┌───────────────────┐
  📢 *sᴛᴀᴛᴜs ᴄᴏɴꜰɪɢ*
  • sᴛᴀᴛᴜs sᴇᴇɴ: ${isEnabled(config.AUTO_STATUS_SEEN) ? "✅" : "❌"}
  • sᴛᴀᴛᴜs ʀᴇᴘʟʏ: ${isEnabled(config.AUTO_STATUS_REPLY) ? "✅" : "❌"}
  • sᴛᴀᴛᴜs ʀᴇᴀᴄᴛ: ${isEnabled(config.AUTO_STATUS_REACT) ? "✅" : "❌"}
└───────────────────┘

┌───────────────────┐
  🛡️ *sᴇᴄᴜʀɪᴛʏ*
  • ᴀɴᴛɪ-ʟɪɴᴋ: ${isEnabled(config.ANTI_LINK) ? "✅" : "❌"}
  • ᴀɴᴛɪ-ʙᴀᴅ: ${isEnabled(config.ANTI_BAD) ? "✅" : "❌"}
  • ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ: ${isEnabled(config.ANTI_DELETE) ? "✅" : "❌"}
└───────────────────┘

📝 *ɴᴏᴛᴇ:* ᴜsᴇ \`${config.PREFIX || '.'}update <ᴠᴀʀ>:<ᴠᴀʟᴜᴇ>\` ᴛᴏ ᴄʜᴀɴɢᴇ sᴇᴛᴛɪɴɢs.

> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

        await conn.sendMessage(from, {
            image: { url: menuImg },
            caption: settingsPanel,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 0,
                isForwarded: false,
                externalAdReply: {
                    title: "𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 sʏsᴛᴇᴍ ᴄᴏɴᴛʀᴏʟ",
                    body: "ᴏꜰꜰɪᴄɪᴀʟ ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ ᴘᴀɴᴇʟ",
                    mediaType: 1,
                    thumbnailUrl: menuImg,
                    sourceUrl: "https://github.com/avishkal428/LAKSHAN-MD",
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Settings command error:', error);
        reply(`❌ *ᴇʀʀᴏʀ:* ${error.message}`);
    }
});
