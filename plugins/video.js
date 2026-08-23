const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search') // yts Variable එක මෙතැනදී Define කර ඇත

cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4"],
    desc: "Download YouTube Videos",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('🎬 කරුණාකර Video නම හෝ YouTube Link එකක් ලබාදෙන්න!')

        await reply('🔍 *Searching & Downloading Video...*')

        let videoUrl = q
        let videoTitle = ''

        // Link එකක් නොවේ නම් yts මඟින් Search කිරීම
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            const search = await yts(q)
            const data = search.videos[0]
            if (!data) return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය.')
            videoUrl = data.url
            videoTitle = data.title
        }

        const apiUrl = `https://www.ominisave.store/api/ytmp4?url=${encodeURIComponent(videoUrl)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data || data.status === false || !data.result) {
            return reply('❌ වීඩියෝ එක Download කිරීමට නොහැකි විය.')
        }

        const video = data.result
        let caption = `🎬 *YOUTUBE VIDEO DOWNLOADER* 🎬\n\n`
        caption += `📝 *Title:* ${video.title || videoTitle || 'YouTube Video'}\n\n`
        caption += `👨‍💻 *Created By:* ${data.creator || '@SaviyaKolla'}`

        await conn.sendMessage(from, { 
            video: { url: video.downloadLink || video.url }, 
            caption: caption 
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
