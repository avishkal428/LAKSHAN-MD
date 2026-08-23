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

        await reply('🔍 *Fetching Video Data...*')

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

        let downloadUrl = null
        let title = videoTitle

        // Working Endpoints
        const apis = [
            `https://api.darksadasyt.mobi/site/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://api.giftedtech.my.id/api/download/dl-ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(videoUrl)}`
        ]

        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 15000 })
                if (res.data) {
                    if (res.data.result && (res.data.result.files || res.data.result.download_url || res.data.result.url || res.data.result.dl_url)) {
                        downloadUrl = res.data.result.files || res.data.result.download_url || res.data.result.url || res.data.result.dl_url
                        title = res.data.result.title || title
                        break
                    } else if (res.data.data && res.data.data.dl) {
                        downloadUrl = res.data.data.dl
                        title = res.data.data.title || title
                        break
                    }
                }
            } catch (err) {
                console.log(`Endpoint Failed: ${api}`)
            }
        }

        if (!downloadUrl) {
            return reply('❌ Download Link එක සකස් කිරීමට නොහැකි විය. කරුණාකර වෙනත් වීඩියෝවක් හෝ මොහොතකින් නැවත උත්සාහ කරන්න.')
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
