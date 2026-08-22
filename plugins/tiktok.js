const axios = require('axios');

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'ttdl'],
    category: 'download',
    desc: 'Download TikTok Videos and Music',
    async execute(m, { conn, args, reply }) {
        try {
            const url = args[0];
            if (!url) return reply('❌ කරුණාකර TikTok වීඩියෝ ලින්ක් එකක් ඇතුළත් කරන්න!\n\n*Example:* .tiktok https://vt.tiktok.com/ZSrGd2UFs/');

            // API එකට Request එක යැවීම
            const apiUrl = `https://www.ominisave.store/api/tiktok?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const res = response.data;

            if (!res.status || !res.downloads) {
                return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය. ලින්ක් එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.');
            }

            // විස්තර සහිත Captain එක සෑදීම
            let caption = `🎵 *TIKTOK DOWNLOADER* 🎵\n\n`;
            caption += `👤 *Author:* ${res.author || 'N/A'}\n`;
            caption += `📝 *Title:* ${res.title || 'No Title'}\n\n`;
            caption += `👁️ *Views:* ${res.stats?.views?.toLocaleString() || 0}\n`;
            caption += `❤️ *Likes:* ${res.stats?.likes?.toLocaleString() || 0}\n`;
            caption += `💬 *Comments:* ${res.stats?.comments?.toLocaleString() || 0}\n`;
            caption += `🔄 *Shares:* ${res.stats?.shares?.toLocaleString() || 0}\n\n`;
            caption += `👨‍💻 *Created By:* ${res.creator || '@SaviyaKolla'}`;

            // වීඩියෝ එක Send කිරීම
            await conn.sendMessage(m.chat, {
                video: { url: res.downloads.video },
                caption: caption
            }, { quoted: m });

            // සින්දුව පමණක් අවශ්‍ය නම් Audio එකත් යැවීම
            if (res.downloads.music) {
                await conn.sendMessage(m.chat, {
                    audio: { url: res.downloads.music },
                    mimetype: 'audio/mp4',
                    fileName: `${res.author || 'tiktok'}_audio.mp3`
                }, { quoted: m });
            }

        } catch (error) {
            console.error(error);
            reply('❌ API එකෙහි දෝෂයක් පවතී. කරුණාකර පසුව උත්සාහ කරන්න.');
        }
    }
};

