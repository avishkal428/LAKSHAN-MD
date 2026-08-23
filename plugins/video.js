const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

// YouTube Link එකෙන් Video ID එක පමණක් වෙන් කරගන්නා Function එක
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}

cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4"],
    desc: "Download YouTube Videos & Shorts",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('🎬 කරුණාකර Video / Shorts Link එකක් හෝ නමක් ලබාදෙන්න!')

        await reply('🔍 *Fetching Video...*')

        let videoUrl = q
        let videoTitle = ''

        // Link එකක් නම් Extra Parameters අයින් කර Clean URL එකක් හදා ගැනීම
        if (q.startsWith('http://') || q.startsWith('https://')) {
            const videoId = extractYouTubeId(q)
            if (videoId) {
                videoUrl = `https://www.youtube.com/watch?v=${videoId}`
            }
        } else {
            // Text Search එකක් නම්
            const search = await yts(q)
            const data = search.videos[0]
            if (!data) return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය.')
            videoUrl = data.url
            videoTitle = data.title
        }

        // Working APIs List
        const apiEndpoints = [
            `https://www.ominisave.store/api/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://api.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://api.dark-yasiya.site/download/ytmp4?url=${encodeURIComponent(videoUrl)}`
        ]

        let downloadUrl = null
        let title = videoTitle

        for (const url of apiEndpoints) {
            try {
                const res = await axios.get(url, { timeout: 12000 })
                if (res.data) {
                    // Ominisave API
                    if (res.data.status && res.data.result && (res.data.result.downloadLink || res.data.result.url)) {
                        downloadUrl = res.data.result.downloadLink || res.data.result.url
                        title = res.data.result.title || title
                        break
                    }
                    // David Cyril API
                    else if (res.data.success && res.data.result && res.data.result.download_url) {
                        downloadUrl = res.data.result.download_url
                        title = res.data.result.title || title
                        break
                    }
                    // Dark Yasiya API
                    else if (res.data.result && res.data.result.og_link) {
                        downloadUrl = res.data.result.og_link
                        title = res.data.result.title || title
                        break
                    }
                }
            } catch (err) {
                console.log(`API Fetch Failed for endpoint: ${url}`)
            }
        }

        if (!downloadUrl) {
            return reply('❌ වීඩියෝ එක Download කිරීමට නොහැකි විය. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.')
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
