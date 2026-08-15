const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "apk",
  alias: ["getapk", "app"],
  react: '📦',
  desc: "Universal APK Downloader",
  category: "download",
  use: ".apk <app name or link>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args, sender }) => {
  try {
    let q = args.join(" ");
    if (!q) return reply('⚠️ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀɴ ᴀᴘᴘ ɴᴀᴍᴇ ᴏʀ ʟɪɴᴋ.*\n\n*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*');

    const reactKey = m?.key || mek.key;
    await conn.sendMessage(from, { react: { text: '⏳', key: reactKey } });

    // 1. Direct File Link එකක් ආවොත් (e.g. https://site.com/file.apk)
    if (q.startsWith("http") && !q.includes("play.google.com")) {
      const fileName = q.split('/').pop().split('?')[0] || "application.apk";
      
      await conn.sendMessage(from, {
        document: { url: q },
        mimetype: 'application/vnd.android.package-archive',
        fileName: fileName.endsWith('.apk') ? fileName : `${fileName}.apk`,
        caption: `*𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`,
        contextInfo: { forwardingScore: 0, isForwarded: false }
      }, { quoted: mek });

      return await conn.sendMessage(from, { react: { text: '✅', key: reactKey } });
    }

    // 2. Play Store Link එකක් ආවොත් Package Name (ID) එක වෙන් කර ගැනීම
    if (q.includes("play.google.com")) {
      const match = q.match(/id=([a-zA-Z0-9._]+)/);
      if (match && match[1]) {
        q = match[1];
      }
    }

    let appData = null;
    let source = "ɴᴇxᴏʀᴀᴄʟᴇ";

    // Source 1: NexOracle API
    try {
      const res = await axios.get(`https://api.nexoracle.com/downloader/apk`, {
        params: { apikey: 'free_key@maher_apis', q },
        timeout: 15000
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

    // Source 2: Aptoide API (App Name & Package ID Support)
    if (!appData) {
      try {
        const res = await axios.get(`https://ws75.aptoide.com/api/7/apps/search`, {
          params: { query: q, limit: 1 },
          timeout: 15000
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

    // Details Box
    const infoMsg = `
*「 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃 : ᴀᴘᴋ ᴄᴏʀᴇ 」*

┌───────────────────┐
  📦 *ᴀᴘᴘ:* ${appData.name}
  📏 *sɪᴢᴇ:* ${appData.size}
  📅 *ᴜᴘᴅ:* ${appData.upd}
  📡 *sʀᴄ:* ${source}
└───────────────────┘
> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

    // Send Image & Details
    await conn.sendMessage(from, {
      image: { url: appData.icon },
      caption: infoMsg,
      contextInfo: { mentionedJid: [sender], forwardingScore: 0, isForwarded: false }
    }, { quoted: mek });

    // Stream Download for Large APKs
    const stream = await axios.get(appData.dl, { responseType: 'stream' });

    await conn.sendMessage(from, {
      document: { stream: stream.data },
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
