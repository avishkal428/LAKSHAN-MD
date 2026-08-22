const { cmd } = require('../command')
const axios = require('axios')

cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    desc: "Download Facebook Videos",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('❌ කරුණාකර Facebook වීඩියෝ link එකක් ලබාදෙන්න!\n\n*Example:* .fb https://www.facebook.com/...')

        await reply('⬇️ *Downloading Facebook video...*')

        const apiUrl = `https://www.ominisave.store/api/fb?url=${encodeURIComponent(q)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data || !data.status || !data.result || !data.result.downloadLink) {
            return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය. Link එක නැවත පරීක්ෂා කරන්න.')
        }

        const video = data.result
        let caption = `🎥 *FACEBOOK DOWNLOADER* 🎥\n\n`
        caption += `📝 *Title:* ${video.title || 'Facebook Video'}\n`
        caption += `🎬 *Quality:* ${video.quality || 'N/A'}\n\n`
        caption += `👨‍💻 *Created By:* ${data.creator || '@SaviyaKolla'}`

        await conn.sendMessage(from, { 
            video: { url: video.downloadLink }, 
            caption: caption 
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})

