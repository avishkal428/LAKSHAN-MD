const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');

module.exports = {
    name: 'song',
    alias: ['audio', 'sing', 'play'],
    category: 'download',
    desc: 'Download YouTube songs using local NPM packages',
    async execute(conn, mek, from, args, msg) {
        try {
            // 1. පරිශීලකයා සින්දුවක නමක් ලබා දී ඇත්දැයි බැලීම
            if (!args[0]) {
                return await conn.sendMessage(from, { 
                    text: "✨ *LAKSHN-MD V1 SONG DOWNLOADER* ✨\n\n❌ කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ඇතුළත් කරන්න.\n\n*උදාහරණ:* `.song Faded` හෝ `.song https://youtu.be/...`" 
                }, { quoted: mek });
            }

            const searchQuery = args.join(" ");
            
            // සෙවීම ආරම්භ කළ බව දැනුම් දීම
            const searchingMsg = await conn.sendMessage(from, { text: "🔍 *YouTube හි සොයමින් පවතියි... කරුණාකර රැඳී සිටින්න...*" }, { quoted: mek });

            // 2. yt-search මඟින් YouTube එකේ සින්දුව සෙවීම
            const searchResult = await ytSearch(searchQuery);
            const videos = searchResult.videos;

            if (!videos || videos.length === 0) {
                return await conn.sendMessage(from, { text: "❌ කණගාටුයි, ඔය නමින් සින්දුවක් සොයාගැනීමට නොහැකි වුණා. වෙනත් නමකින් උත්සාහ කරන්න." }, { quoted: mek });
            }

            // ප්‍රධානම සහ ගැලපෙනම වීඩියෝවේ තොරතුරු ලබා ගැනීම
            const video = videos[0];
            const videoUrl = video.url;
            const title = video.title;
            const duration = video.timestamp;
            const views = video.views.toLocaleString();
            const ago = video.ago;

            // සින්දුවේ විස්තර ලස්සනට පෙන්වීම
            const detailsText = `🎵 *LAKSHN-MD V1 SONG PLAYER* 🎵\n\n` +
                                `🎼 *සින්දුවේ නම:* ${title}\n` +
                                `⏳ *කාලය:* ${duration}\n` +
                                `👁️ *නැරඹුම් වාර:* ${views}\n` +
                                `📅 *මුදාහළ කාලය:* ${ago}\n\n` +
                                `📥 *ඔබගේ සින්දුව බාගත වෙමින් පවතියි... නිම වූ සැනින් WhatsApp වෙත එවනු ලැබේ.*`;

            await conn.sendMessage(from, { text: detailsText }, { quoted: mek });

            // 3. ytdl-core මඟින් කිසිම API එකක් නැතුව වීඩියෝ එක Audio Stream එකක් විදිහට ලබා ගැනීම
            // මෙහිදී සර්වර් එකේ storage එක පිරෙන්නේ නැති වෙන්න කෙලින්ම stream එකක් විදිහට වැඩේ සිද්ධ වෙනවා
            const audioStream = ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25 // වේගයෙන් ඩවුන්ලෝඩ් වීමට buffer එක වැඩි කිරීම
            });

            // 4. බාගත කරගත් Audio එක WhatsApp හරහා Document එකක් සහ Audio එකක් ලෙස යැවීම
            // Document එකක් ලෙස යැවීම (Original Quality එක රැක ගැනීමට)
            await conn.sendMessage(from, { 
                document: audioStream, 
                mimetype: 'audio/mpeg', 
                fileName: `${title}.mp3` 
            }, { quoted: mek });

        } catch (error) {
            console.error("Song Command Error: ", error);
            await conn.sendMessage(from, { text: "❌ කණගාටුයි, සින්දුව ඩවුන්ලෝඩ් කිරීමේදී සර්වර් එක තුළ දෝෂයක් සිදු වුණා. කරුණාකර නැවත උත්සාහ කරන්න." }, { quoted: mek });
        }
    }
};
