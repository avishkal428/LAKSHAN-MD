const axios = require('axios');

module.exports = {
    name: "tiktok",
    alias: ["tt", "ttdl"],
    category: "download",
    desc: "Download TikTok Videos",
    async execute(m, { conn, args, reply }) {
        try {
            const url = args[0];
            if (!url) return reply('❌ කරුණාකර TikTok වීඩියෝ link එකක් ලබාදෙන්න!');

            const apiUrl = `https://www.ominisave.store/api/tiktok?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const res = response.data;

            if (!res.status || !res.downloads) {
                return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය.');
            }

            let caption = `🎵 *TIKTOK DOWNLOADER*\n\n`;
            caption += `👤 *Author:* ${res.author || 'N/A'}\n`;
            caption += `📝 *Title:* ${res.title || 'No Title'}\n`;
            caption += `👨‍💻 *Created By:* ${res.creator || '@SaviyaKolla'}`;

            await conn.sendMessage(m.chat, {
                video: { url: res.downloads.video },
                caption: caption
            }, { quoted: m });

            if (res.downloads.music) {
                await conn.sendMessage(m.chat, {
                    audio: { url: res.downloads.music },
                    mimetype: 'audio/mp4',
                    fileName: 'tiktok_audio.mp3'
                }, { quoted: m });
            }

        } catch (error) {
            console.error(error);
            reply('❌ Error එකක් ආවා, නැවත උත්සාහ කරන්න.');
        }
    }
};
