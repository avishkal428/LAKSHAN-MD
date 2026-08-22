const { cmd } = require('../command')
const axios = require('axios')

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok Videos",
    category: "download",
    filename: __filename
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ කරුණාකර TikTok link එකක් ලබාදෙන්න!\n\n*Example:* .tiktok https://vt.tiktok.com/ZSrGd2UFs/')

        reply('⬇️ *Downloading TikTok video...*')

        const apiUrl = `https://www.ominisave.store/api/tiktok?url=${encodeURIComponent(q)}`
        const { data } = await axios.get(apiUrl)

        if (!data || !data.status || !data.downloads) {
            return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය. Link එක පරීක්ෂා කරන්න.')
        }

        let caption = `🎵 *TIKTOK DOWNLOADER* 🎵\n\n`
        caption += `👤 *Author:* ${data.author || 'N/A'}\n`
        caption += `📝 *Title:* ${data.title || 'No Title'}\n\n`
        caption += `👁️ *Views:* ${data.stats?.views?.toLocaleString() || 0}\n`
        caption += `❤️ *Likes:* ${data.stats?.likes?.toLocaleString() || 0}\n\n`
        caption += `👨‍💻 *Created By:* ${data.creator || '@SaviyaKolla'}`

        // Send Video
        if (data.downloads.video) {
            await conn.sendMessage(from, { 
                video: { url: data.downloads.video }, 
                caption: caption 
            }, { quoted: mek })
        }

        // Send Audio
        if (data.downloads.music) {
            await conn.sendMessage(from, { 
                audio: { url: data.downloads.music }, 
                mimetype: 'audio/mp4',
                fileName: 'tiktok.mp3'
            }, { quoted: mek })
        }

    } catch (e) {
        console.error(e)
        reply(`❌ දෝෂයක් සිදු විය: ${e.message}`)
    }
})
