const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "apk",
  alias: ["getapk", "app"],
  react: '📦',
  desc: "Universal APK Downloader",
  category: "download",
  use: ".apk <app name>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args, sender }) => {
  try {
    const q = args.join(" ");
    if (!q) return reply('⚠️ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀɴ ᴀᴘᴘ ɴᴀᴍᴇ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');

    // Safe Reaction key check
    const reactKey = m?.key || mek.key;
    await conn.sendMessage(from, { react: { text: '⏳', key: reactKey } });

    let appData = null;
    let source = "ɴᴇxᴏʀᴀᴄʟᴇ";

    // Source 1: NexOracle
    try {
      const res = await axios.get(`https://api.nexoracle.com/downloader/apk`, {
        params: { apikey: 'free_key@maher_apis', q },
        timeout: 10000
      });
      if (res.data?.status === 200 && res.data.result) {
        const r = res.data.result;
        appData = {
          name: r.name || q,
          size: r.size || "Unknown",
          upd: r.lastup || "N/A",
          icon: r.icon || "https://i.imgur.com/2wz94kY.png",
          dl: r.dllink
        };
      }
    } catch (e) { /* fallback */ }

    // Source 2: Aptoide (Fixed URL parameter)
    if (!appData) {
      try {
        const res = await axios.get(`https://ws75.aptoide.com/api/7/apps/search`, {
          params: { query: q, limit: 1 },
          timeout: 10000
        });
        if (res.data?.datalist?.list?.length) {
          const r = res.data.datalist.list[0];
          source = "ᴀᴘᴛᴏɪᴅᴇ";
          appData = {
            name: r.name,
            size: r.size ? (r.size / 1048576).toFixed(2) + " MB" : "Unknown",
            upd: r.updated || "N/A",
            icon: r.icon || "https://i.imgur.com/2wz94kY.png",
            dl: r.file?.path_alt || r.file?.path
          };
        }
      } catch (e) { /* both failed */ }
    }

    if (!appData || !appData.dl) {
      await conn.sendMessage(from, { react: { text: '❌', key: reactKey } });
      return reply('❌ *ᴀᴘᴘ ɴᴏᴛ ꜰᴏᴜɴᴅ ɪɴ ᴀɴʏ ᴅᴀᴛᴀʙᴀsᴇ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
    }

    // Cyber-Grid UI
    const infoMsg = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ᴀᴘᴋ ᴄᴏʀᴇ 」*

┌───────────────────┐
  📦 *ᴀᴘᴘ:* ${appData.name}
  📏 *sɪᴢᴇ:* ${appData.size}
  📅 *ᴜᴘᴅ:* ${appData.upd}
  📡 *sʀᴄ:* ${source}
└───────────────────┘
> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃`;

    // Send Icon & Details
    await conn.sendMessage(from, {
      image: { url: appData.icon },
      caption: infoMsg,
      contextInfo: { mentionedJid: [sender], forwardingScore: 0, isForwarded: false }
    }, { quoted: mek });

    // Send APK Document File
    await conn.sendMessage(from, {
      document: { url: appData.dl },
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${appData.name.replace(/[^a-zA-Z0-9]/g, "_")}.apk`,
      caption: `*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`,
      contextInfo: { forwardingScore: 0, isForwarded: false }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: reactKey } });

  } catch (error) {
    console.error(error);
    reply('❌ *ᴅᴏᴡɴʟᴏᴀᴅ ᴘʀᴏᴛᴏᴄᴏʟ ꜰᴀɪʟᴇᴅ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');
  }
});

