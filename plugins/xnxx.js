const { cmd } = require('../command');
const axios = require('axios');

const API_KEY = 'sahan_ca673fc4196de890703baca32f470108';

// 1. Search Command
cmd({
    pattern: "xnxxsearch",
    alias: ["xnxxs"],
    desc: "Search videos on XNXX",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("⚠️ කරුණාකර සෙවීමට නමක් ඇතුළත් කරන්න! (Ex: .xnxxsearch viral)");

        const searchUrl = `https://sahan-api-hub.vercel.app/api/adult/xnxx/search?apikey=${API_KEY}&q=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl, { timeout: 30000 });
        const data = response.data;

        const results = data.result || data.data || data;

        if (!results || !Array.isArray(results) || results.length === 0) {
            return reply("❌ කිසිදු වීඩියෝවක් හමු නොවීය.");
        }

        let msg = `🔞 *XNXX SEARCH RESULTS* 🔞\n\n`;
        results.slice(0, 10).forEach((item, index) => {
            msg += `*${index + 1}.* ${item.title || 'No Title'}\n`;
            msg += `🔗 *Link:* ${item.link || item.url}\n\n`;
        });

        msg += `💡 *Download කිරීමට:* \n.xnxx <Video_URL>`;

        return await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        console.error(e);
        return reply("❌ Search කිරීමේදී දෝෂයක් සිදු විය. පසුව නැවත උත්සාහ කරන්න.");
    }
});

// 2. Large File Stream Downloader Command (Up to 2GB)
cmd({
    pattern: "xnxx",
    alias: ["xnxxdl"],
    desc: "Download videos from XNXX as Document",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("⚠️ කරුණාකර XNXX වීඩියෝ Link එක ලබාදෙන්න! (Ex: .xnxx <URL>)");

        await reply("📥 වීඩියෝ විස්තර ලබා ගනිමින් පවතී, කරුණාකර රැඳී සිටින්න...");

        // 1. Fetch Download Link from API
        const downloadApiUrl = `https://sahan-api-hub.vercel.app/api/adult/xnxx/download?apikey=${API_KEY}&url=${encodeURIComponent(q)}`;
        const apiResponse = await axios.get(downloadApiUrl, { timeout: 60000 });
        const data = apiResponse.data;

        const result = data.result || data.data || data;
        const mediaUrl = result.files?.high || result.files?.low || result.dl_link || result.download_url;

        if (!mediaUrl) {
            return reply("❌ වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය.");
        }

        const title = result.title || 'XNXX_Video';
        const cleanTitle = title.replace(/[\\/:*?"<>|]/g, "_"); // Filename cleanup

        await reply("⚡ 2GB දක්වා Files සඳහා Stream Mode සක්‍රීයයි! Upload වීම ආරම්භ වේ...");

        // 2. Stream File Direct to WhatsApp without storing in RAM
        const mediaStream = await axios({
            method: 'get',
            url: mediaUrl,
            responseType: 'stream',
            timeout: 0 // Disable timeout for large files
        });

        const caption = `🔞 *XNXX DOWNLOADER* 🔞\n\n📌 *Title:* ${title}\n⏱️ *Duration:* ${result.duration || 'N/A'}\n\n© Powered by LAKSHAN-MD`;

        // Send as Document (Supports up to 2GB)
        await conn.sendMessage(from, {
            document: { stream: mediaStream.data },
            mimetype: 'video/mp4',
            fileName: `${cleanTitle}.mp4`,
            caption: caption
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        return reply("❌ Download/Upload කිරීමේදී දෝෂයක් සිදු විය. File එක විශාල වැඩි වීම නිසා Server එකෙන් Cancel වූවා විය හැක.");
    }
});

