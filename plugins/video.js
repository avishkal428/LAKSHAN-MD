const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4"],
    desc: "Download YouTube Videos",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('🎬 කරුණාකර Video / Shorts Link එකක් හෝ නමක් ලබාදෙන්න!')

        await reply('🔍 *Downloading Video...*')

        let videoUrl = q
        let videoTitle = ''

        if (q.startsWith('http://') || q.startsWith('https://')) {
            const videoId = extractYouTubeId(q)
            if (videoId) videoUrl = `https://www.youtube.com/watch?v=${videoId}`
        } else {
            const search = await yts(q)
            const data = search.videos[0]
            if (!data) return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය.')
            videoUrl = data.url
            videoTitle = data.title
        }

        // Dedicated Direct API Request
        const res = await axios.get(`https://api.vreden.web.id/api/ytmp4?url=${encodeURIComponent(videoUrl)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 20000
        })

        let downloadUrl = null
        let title = videoTitle

        if (res.data && res.data.result && res.data.result.download) {
            downloadUrl = res.data.result.download.url
            title = res.data.result.title || title
        } else if (res.data && res.data.result && res.data.result.url) {
            downloadUrl = res.data.result.url
            title = res.data.result.title || title
        }

        if (!downloadUrl) {
            return reply('❌ සර්වර් එකේ ගැටලුවක් නිසා වීඩියෝ එක ගැනීමට නොහැකි විය. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.')
        }

        let caption = `🎬 *YOUTUBE DOWNLOADER* 🎬\n\n📝 *Title:* ${title || 'YouTube Video'}`

        await conn.sendMessage(from, { 
            video: { url: downloadUrl }, 
            caption: caption 
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
