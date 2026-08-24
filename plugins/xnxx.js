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
        
        if (!response.data || response.status !== 200) {
            return reply("❌ API Server එකෙන් ප්‍රතිචාරයක් නොලැබුණි.");
        }

        const results = response.data.result || response.data.data || response.data;

        if (!results || !Array.isArray(results) || results.length === 0) {
            return reply("❌ කිසිදු වීඩියෝවක් හමු නොවීය.");
        }

        let msg = `🔞 *XNXX SEARCH RESULTS* 🔞\n\n`;
        results.slice(0, 10).forEach((item, index) => {
            msg += `*${index + 1}.* ${item.title || 'No Title'}\n`;
            msg += `🔗 *Link:* ${item.link || item.url}\n\n`;
        });

        msg += `💡 *Download කිරීමට Link එක Copy කර යවන්න:* \n.xnxx <Video_URL>`;

        return await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        console.error("XNXX Search Error:", e.message);
        return reply("❌ Search කිරීමේදී දෝෂයක් සිදු විය. API Server එක ක්‍රියා විරහිත වී තිබිය හැක.");
    }
});

// 2. Download Command (Auto detects Link or Search Term)
cmd({
    pattern: "xnxx",
    alias: ["xnxxdl"],
    desc: "Download videos from XNXX",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("⚠️ කරුණාකර XNXX වීඩියෝ Link එකක් ලබාදෙන්න! (Ex: .xnxx https://www.xnxx.com/video-...)");

        // Link එකක් නෙමේ නම් auto search එකට redirect කිරීම
        if (!q.includes("xnxx.com")) {
            return reply("⚠️ මෙය නිවැරදි XNXX Link එකක් නොවේ! Search කිරීමට නම් `.xnxxsearch " + q + "` භාවිතා කරන්න.");
        }

        await reply("📥 වීඩියෝ විස්තර ලබා ගනිමින් පවතී, කරුණාකර රැඳී සිටින්න...");

        const downloadApiUrl = `https://sahan-api-hub.vercel.app/api/adult/xnxx/download?apikey=${API_KEY}&url=${encodeURIComponent(q)}`;
        const apiResponse = await axios.get(downloadApiUrl, { timeout: 60000 });
        
        if (!apiResponse.data) {
            return reply("❌ API Server එකෙන් දත්ත ලබා ගැනීමට නොහැකි විය.");
        }

        const result = apiResponse.data.result || apiResponse.data.data || apiResponse.data;
        const mediaUrl = result.files?.high || result.files?.low || result.dl_link || result.download_url;

        if (!mediaUrl) {
            return reply("❌ වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය. වෙනත් Link එකක් උත්සාහ කරන්න.");
        }

        const title = result.title || 'XNXX_Video';
        const cleanTitle = title.replace(/[\\/:*?"<>|]/g, "_");

        await reply("⚡ File එක Document එකක් ලෙස Upload වීම ආරම්භ වේ...");

        // Stream File Directly to prevent RAM crashes
        const mediaStream = await axios({
            method: 'get',
            url: mediaUrl,
            responseType: 'stream',
            timeout: 0
        });

        const caption = `🔞 *XNXX DOWNLOADER* 🔞\n\n📌 *Title:* ${title}\n⏱️ *Duration:* ${result.duration || 'N/A'}\n\n© Powered by LAKSHAN-MD`;

        await conn.sendMessage(from, {
            document: { stream: mediaStream.data },
            mimetype: 'video/mp4',
            fileName: `${cleanTitle}.mp4`,
            caption: caption
        }, { quoted: mek });

    } catch (e) {
        console.error("XNXX Download Error:", e.message);
        return reply("❌ Download කිරීමේදී දෝෂයක් සිදු විය. API Server එකේ ප්‍රශ්නයක් හෝ Link එක අසංගත විය හැක.");
    }
});
