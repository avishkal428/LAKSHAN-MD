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

    // Direct APK Link
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

    // Play Store URL Extractions
    if (q.includes("play.google.com")) {
      const match = q.match(/id=([a-zA-Z0-9._]+)/);
      if (match && match[1]) {
        q = match[1];
      }
    }

    let appData = null;

    // API Source 1: Bk9 Free API
    try {
      const res = await axios.get(`https://bk9.fun/download/apk?q=${encodeURIComponent(q)}`, { timeout: 15000 });
      if (res.data?.status && res.data?.BK9) {
        const r = res.data.BK9;
        appData = {
          name: r.name || q,
          size: r.size || "Unknown",
          upd: r.lastup || "N/A",
          icon: r.icon || "https://i.imgur.com/2wz94kY.png",
          dl: r.dllink
        };
      }
    } catch (e) { /* fallback */ }

    // API Source 2: David Cyril API (Backup)
    if (!appData) {
      try {
        const res = await axios.get(`https://api.davidcyriltech.my.id/download/apk?text=${encodeURIComponent(q)}`, { timeout: 15000 });
        if (res.data?.success && res.data?.result) {
          const r = res.data.result;
          appData = {
            name: r.name,
            size: r.size || "Unknown",
            upd: r.lastUpdate || "N/A",
            icon: r.icon || "https://i.imgur.com/2wz94kY.png",
            dl: r.dllink
          };
        }
      } catch (e) { /* fallback */ }
    }

    // API Source 3: Aptoide Direct Web API
    if (!appData) {
      try {
        const res = await axios.get(`https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(q)}/limit=1`, { timeout: 15000 });
        if (res.data?.datalist?.list?.length) {
          const r = res.data.datalist.list[0];
          appData = {
            name: r.name,
            size: r.size ? (r.size / 1048576).toFixed(2) + " MB" : "Unknown",
            upd: r.updated || "N/A",
            icon: r.icon || "https://i.imgur.com/2wz94kY.png",
            dl: r.file?.path_alt || r.file?.path
          };
        }
      } catch (e) { /* failed */ }
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
└───────────────────┘
> *𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃*`;

    // Send Icon & Details Card
    await conn.sendMessage(from, {
      image: { url: appData.icon },
      caption: infoMsg,
      contextInfo: { mentionedJid: [sender], forwardingScore: 0, isForwarded: false }
    }, { quoted: mek });

    // Send APK Direct File
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
