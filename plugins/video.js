const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

const videoRequests = new Map()

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4"],
    desc: "Download YouTube Videos with Quality",
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

        // Cobalt API (Cloudflare / YouTube Bot Protection Bypass කරන ප්‍රධාන API එක)
        let videoData = null
        try {
            const res = await axios.post('https://api.cobalt.tools/api/json', {
                url: videoUrl,
                videoQuality: "720"
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            })

            if (res.data && res.data.url) {
                videoData = {
                    url: res.data.url,
                    title: videoTitle || "YouTube Video"
                }
            }
        } catch (e) {
            console.log("Cobalt API Failed, trying scraper...")
        }

        // Backup Scraper API (Cobalt එක Fail වුවහොත්)
        if (!videoData) {
            try {
                const res = await axios.get(`https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(videoUrl)}`)
                if (res.data && res.data.result && res.data.result.download) {
                    videoData = {
                        url: res.data.result.download.url,
                        title: res.data.result.title || videoTitle
                    }
                }
            } catch (err) {
                console.log("Backup API Failed")
            }
        }

        if (!videoData) {
            return reply('❌ YouTube Bot Block එක නිසා වීඩියෝ එක ලබාගත නොහැකි විය. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.')
        }

        let caption = `🎬 *YOUTUBE DOWNLOADER* 🎬\n\n📝 *Title:* ${videoData.title}`

        await conn.sendMessage(from, { 
            video: { url: videoData.url }, 
            caption: caption 
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
