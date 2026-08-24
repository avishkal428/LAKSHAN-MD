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
        
        const results = response.data?.result || response.data?.data || response.data?.results || response.data;

        if (!results || !Array.isArray(results) || results.length === 0) {
            return reply("❌ කිසිදු වීඩියෝවක් හමු නොවීය.");
        }

        let msg = `🔞 *XNXX SEARCH RESULTS* 🔞\n\n`;
        results.slice(0, 10).forEach((item, index) => {
            msg += `*${index + 1}.* ${item.title || item.name || 'No Title'}\n`;
            msg += `🔗 *Link:* ${item.link || item.url || item.video}\n\n`;
        });

        msg += `💡 *Download කිරීමට:* \n.xnxx <Video_URL>`;

        return await conn.sendMessage(from, { text: msg }, { quoted: mek });

    } catch (e) {
        console.error("XNXX Search Error:", e);
        return reply("❌ Search කිරීමේදී දෝෂයක් සිදු විය.");
    }
});

// 2. Download Command (All JSON Response Structures Handled)
cmd({
    pattern: "xnxx",
    alias: ["xnxxdl"],
    desc: "Download videos from XNXX",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("⚠️ කරුණාකර XNXX වීඩියෝ Link එක ලබාදෙන්න!");

        if (!q.includes("xnxx.com")) {
            return reply("⚠️ මෙය නිවැරදි XNXX Link එකක් නොවේ! Search කිරීමට `.xnxxsearch " + q + "` භාවිතා කරන්න.");
        }

        await reply("📥 වීඩියෝ විස්තර ලබා ගනිමින් පවතී, කරුණාකර රැඳී සිටින්න...");

        const downloadApiUrl = `https://sahan-api-hub.vercel.app/api/adult/xnxx/download?apikey=${API_KEY}&url=${encodeURIComponent(q)}`;
        const apiResponse = await axios.get(downloadApiUrl, { timeout: 60000 });
        const resData = apiResponse.data;

        // API Response Structure එක සොයාගැනීම (Check all possibilities)
        const result = resData?.result || resData?.data || resData;
        
        const mediaUrl = 
            result?.files?.high || 
            result?.files?.low || 
            result?.dl_link || 
            result?.download || 
            result?.download_url || 
            result?.url || 
            (typeof result === 'string' ? result : null);

        if (!mediaUrl || typeof mediaUrl !== 'string') {
            console.log("API Full Response:", JSON.stringify(resData));
            return reply("❌ වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය. API Response structure එක වෙනස් වී ඇත.");
        }

        const title = result?.title || result?.name || 'XNXX_Video';
        const cleanTitle = title.replace(/[\\/:*?"<>|]/g, "_");

        await reply("⚡ Download ආරම්භ විය! Document ලෙස Upload වේ...");

        // Stream direct to WhatsApp to bypass RAM limits
        const mediaStream = await axios({
            method: 'get',
            url: mediaUrl,
            responseType: 'stream',
            timeout: 0
        });

        const caption = `🔞 *XNXX DOWNLOADER* 🔞\n\n📌 *Title:* ${title}\n⏱️ *Duration:* ${result?.duration || 'N/A'}\n\n© Powered by LAKSHAN-MD`;

        await conn.sendMessage(from, {
            document: { stream: mediaStream.data },
            mimetype: 'video/mp4',
            fileName: `${cleanTitle}.mp4`,
            caption: caption
        }, { quoted: mek });

    } catch (e) {
        console.error("XNXX Download Error:", e.message);
        return reply("❌ Download කිරීමේදී දෝෂයක් සිදු විය.");
    }
});
