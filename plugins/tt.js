const { cmd } = require('../command')
const axios = require('axios')

cmd({
    pattern: "tt",
    alias: ["tiktok", "ttdl"],
    desc: "Download TikTok Videos",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ කරුණාකර TikTok link එකක් ලබාදෙන්න!')

        await reply('⬇️ *Downloading TikTok video...*')

        const apiUrl = `https://www.ominisave.store/api/tiktok?url=${encodeURIComponent(q)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data || !data.status || !data.downloads) {
            return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය.')
        }

        let caption = `🎵 *TIKTOK DOWNLOADER* 🎵\n\n`
        caption += `👤 *Author:* ${data.author || 'N/A'}\n`
        caption += `📝 *Title:* ${data.title || 'No Title'}\n\n`
        caption += `👨‍💻 *Created By:* ${data.creator || '@SaviyaKolla'}`

        if (data.downloads.video) {
            await conn.sendMessage(from, { 
                video: { url: data.downloads.video }, 
                caption: caption 
            }, { quoted: mek })
        }

        if (data.downloads.music) {
            await conn.sendMessage(from, { 
                audio: { url: data.downloads.music }, 
                mimetype: 'audio/mp4',
                fileName: 'tiktok.mp3'
            }, { quoted: mek })
        }

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
