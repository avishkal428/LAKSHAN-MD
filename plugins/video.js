const config = require('../config');
const { cmd } = require('../command');
const DY_SCRAP = require('@dark-yasiya/scrap');
const GIFTED_DLS = require('gifted-dls');
const dy_scrap = new DY_SCRAP();
const gifted = new GIFTED_DLS();

function replaceYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

cmd({
    pattern: "video",
    alias: ["ytmp4", "ytmp4dl"],
    react: "🎥",
    desc: "Download videos using YouTube search or URL",
    category: "download",
    use: ".video <Text or YT URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a video name or YouTube URL!");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        // Search using dy_scrap.ytsearch if no valid YouTube ID is found
        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply("❌ No video found!");
            id = searchResults.results[0].videoId;
        }

        // Fetch video details using dy_scrap.ytsearch
        const data = await dy_scrap.ytsearch(https://youtube.com/watch?v=${id});
        if (!data?.results?.length) return await reply("❌ Failed to fetch video details!");

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        // Send video details with thumbnail and quality options
        let info = 🎥 *VIDEO DOWNLOADER* 🎥\n\n +
            🎵 *Title:* ${title || "Unknown"}\n +
            ⏳ *Duration:* ${timestamp || "Unknown"}\n +
            👀 *Views:* ${views || "Unknown"}\n +
            🌏 *Uploaded:* ${ago || "Unknown"}\n +
            👤 *Author:* ${author?.name || "Unknown"}\n +
            🖇 *URL:* ${url || "Unknown"}\n\n +
            🔽 *Choose your download format and quality:*\n +
            🎥 *Video Format:*\n +
            1.1 *360p* 📼\n +
            1.2 *720p* 📺\n +
            1.3 *1080p* 🖥️\n\n +
            📁 *Document Format:*\n +
            2.1 *360p* 📼\n +
            2.2 *720p* 📺\n +
            2.3 *1080p* 🖥️\n\n +
            ${config.FOOTER || "*© POWERED BY QUEEN GIMI*"};

        const sentMsg = await conn.sendMessage(from, { image: { url: image }, caption: info }, { quoted: mek });
        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '🎬', key: sentMsg.key } });

        // Listen for user reply to select download format and quality
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            try {
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message) return;

                const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (!isReplyToSentMsg) return;

                let userReply = messageType.trim();
                let msg;
                let quality;
                let type;

                // Send "Downloading..." message immediately after option selection
                msg = await conn.sendMessage(from, { text: "⏳ Downloading..." }, { quoted: mek });

                // Determine quality based on user selection
                if (userReply === "1.1" || userReply === "2.1") {
                    quality = 360;
                } else if (userReply === "1.2" || userReply === "2.2") {
                    quality = 720;
                } else if (userReply === "1.3" || userReply === "2.3") {
                    quality = 1080;
                } else {
                    await conn.sendMessage(from, { text: "❌ Invalid choice! Please select 1.1, 1.2, 1.3, 2.1, 2.2, or 2.3.", edit: msg.key });
                    return;
    }
