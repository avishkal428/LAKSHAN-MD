const ytSearch = require('yt-search');
const { downloadAudio } = require('gifted-dls'); // ඔයාගේ package.json එකේ තියෙන package එකක්

module.exports = {
    name: 'song',
    alias: ['audio', 'sing', 'play'],
    category: 'download',
    desc: 'Download YouTube songs easily',
    async execute(conn, mek, from, args, msg) {
        try {
            // 1. නමක් ඇතුළත් කර ඇත්දැයි බැලීම
            if (!args[0]) {
                return await conn.sendMessage(from, { 
                    text: "✨ *LAKSHN-MD V1 SONG DOWNLOADER* ✨\n\n❌ කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ඇතුළත් කරන්න.\n\n*උදාහරණ:* `.song Faded`" 
                }, { quoted: mek });
            }

            const searchQuery = args.join(" ");
            
            // සෙවීම ආරම්භ කළ බව දැනුම් දීම
            await conn.sendMessage(from, { text: "🔍 *YouTube හි සොයමින් පවතියි...*" }, { quoted: mek });

            // 2. YouTube සෙවීම
            const searchResult = await ytSearch(searchQuery);
            const videos = searchResult.videos;

            if (!videos || videos.length === 0) {
                return await conn.sendMessage(from, { text: "❌ කණගාටුයි, ඔය නමින් සින්දුවක් සොයාගැනීමට නොහැකි වුණා." }, { quoted: mek });
            }

            const video = videos[0];
            const videoUrl = video.url;
            const title = video.title;

            // සින්දුවේ විස්තර පෙන්වීම
            const detailsText = `🎵 *LAKSHN-MD V1 SONG PLAYER* 🎵\n\n` +
                                `🎼 *සින්දුවේ නම:* ${title}\n` +
                                `⏳ *කාලය:* ${video.timestamp}\n\n` +
                                `📥 *ඔබගේ සින්දුව බාගත වෙමින් පවතියි...*`;

            await conn.sendMessage(from, { text: detailsText }, { quoted: mek });

            // 3. gifted-dls මඟින් ආරක්ෂිතව සින්දුව බාගත කිරීම
            const downloadResult = await downloadAudio(videoUrl);
            
            if (!downloadResult || !downloadResult.result) {
                return await conn.sendMessage(from, { text: "❌ සින්දුව බාගත කිරීමට නොහැකි වුණා. නැවත උත්සාහ කරන්න." }, { quoted: mek });
            }

            // 4. WhatsApp හරහා සින්දුව යැවීම
            await conn.sendMessage(from, { 
                document: { url: downloadResult.result }, 
                mimetype: 'audio/mpeg', 
                fileName: `${title}.mp3` 
            }, { quoted: mek });

        } catch (error) {
            console.error("Song Command Error: ", error);
            await conn.sendMessage(from, { text: "❌ කෝඩ් එකේ දෝෂයක් තියෙනවා. කරුණාකර බොට්ගේ Terminal/CMD එක පරික්ෂා කරන්න." }, { quoted: mek });
        }
    }
};
