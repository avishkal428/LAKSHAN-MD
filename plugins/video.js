const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

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

        await reply('🔍 *Fetching Video...*')

        let videoUrl = q
        let videoTitle = ''

        // Shorts Link එක Watch Link එකකට Convert කිරීම
        if (videoUrl.includes('youtube.com/shorts/')) {
            videoUrl = videoUrl.replace('youtube.com/shorts/', 'youtube.com/watch?v=')
        }

        // Link එකක් නොවේ නම් yts මඟින් Search කිරීම
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            const search = await yts(q)
            const data = search.videos[0]
            if (!data) return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය.')
            videoUrl = data.url
            videoTitle = data.title
        }

        // API List (එකක් Fail වුවහොත් ඊළඟ එකට Auto යයි)
        const apiEndpoints = [
            `https://api.dark-yasiya.site/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://api.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`,
            `https://www.ominisave.store/api/ytmp4?url=${encodeURIComponent(videoUrl)}`
        ]

        let downloadUrl = null
        let title = videoTitle

        for (const url of apiEndpoints) {
            try {
                const res = await axios.get(url, { timeout: 10000 })
                if (res.data) {
                    // Dark Yasiya API
                    if (res.data.result && res.data.result.og_link) {
                        downloadUrl = res.data.result.og_link
                        title = res.data.result.title || title
                        break
                    }
                    // David Cyril API
                    else if (res.data.success && res.data.result && res.data.result.download_url) {
                        downloadUrl = res.data.result.download_url
                        title = res.data.result.title || title
                        break
                    }
                    // Ominisave API
                    else if (res.data.status && res.data.result && (res.data.result.downloadLink || res.data.result.url)) {
                        downloadUrl = res.data.result.downloadLink || res.data.result.url
                        title = res.data.result.title || title
                        break
                    }
                }
            } catch (err) {
                console.log(`API Failed: ${url}`)
            }
        }

        if (!downloadUrl) {
            return reply('❌ දැනට පවතින සියලුම Downloader APIs අක්‍රියයි. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.')
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
