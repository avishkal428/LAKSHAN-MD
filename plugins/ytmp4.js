const config = require('../config');
const { cmd } = require('../command');
const { Downloader } = require('abot-scraper');
const downloader = new Downloader();

cmd({
    pattern: "mp4",
    alias: ["ytmp4", "youtubemp4"],
    react: "🎥",
    desc: "Download YouTube video as MP4",
    category: "download",
    use: ".mp4 <YouTube URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("https://")) return await reply("❌ Please provide a valid YouTube URL!");

        // Fetch MP4 details using abot-scraper
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const result = await downloader.youtubeDownloader(q);
        if (!result) {
            return await reply("❌ Failed to fetch YouTube video details!");
        }

        // Send the raw response from abot-scraper
        const responseText = JSON.stringify(result, null, 2);
        await conn.sendMessage(from, { text: 🎥 *YouTube MP4 Downloader*\n\n📋 *Response from abot-scraper:*\n\\\\n${responseText}\n\\\\n\n${config.FOOTER || "*© POWERED BY QUEEN GIMI*"} }, { quoted: mek });

        // Send the MP4 file if a download link is available
        if (result.video) {
            await conn.sendMessage(from, { text: ⏳ Downloading *${result.title || "YouTube Video"}*... }, { quoted: mek });
            await conn.sendMessage(from, {
                video: { url: result.video },
                mimetype: "video/mp4",
                caption: *${result.title || "YouTube Video"}*\n*© POWERED BY QUEEN GIMI*
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
            await reply("✅ Video Upload Successful ✅");
        } else {
            await reply("❌ No downloadable MP4 link found in the response!");
        }

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(❌ *An error occurred:* ${error.message || "Error!"});
    }
});
