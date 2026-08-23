const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

cmd({
    pattern: "video",
    alias: ["ytv", "ytmp4", "shorts"],
    desc: "Download YouTube Videos & Shorts",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('🎬 කරුණාකර Video / Shorts Link එකක් හෝ නමක් ලබාදෙන්න!')

        await reply('🔍 *Downloading Video / Short...*')

        let videoUrl = q
        let videoTitle = ''

        // Shorts URL එක Normal URL එකකට Convert කිරීම
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

        // 1 වන API එක (Ominisave)
        try {
            const apiUrl = `https://www.ominisave.store/api/ytmp4?url=${encodeURIComponent(videoUrl)}`
            const res = await axios.get(apiUrl)
            
            if (res.data && res.data.status && res.data.result && (res.data.result.downloadLink || res.data.result.url)) {
                const video = res.data.result
                let caption = `🎬 *YOUTUBE DOWNLOADER* 🎬\n\n`
                caption += `📝 *Title:* ${video.title || videoTitle || 'YouTube Video'}\n\n`
                caption += `👨‍💻 *Created By:* ${res.data.creator || '@SaviyaKolla'}`

                return await conn.sendMessage(from, { 
                    video: { url: video.downloadLink || video.url }, 
                    caption: caption 
                }, { quoted: mek })
            }
        } catch (err) {
            console.log("Primary API failed, trying backup API 1...")
        }

        // 2 වන API එක (Backup 1)
        try {
            const backupApiUrl = `https://api.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`
            const backupRes = await axios.get(backupApiUrl)

            if (backupRes.data && backupRes.data.success && backupRes.data.result && backupRes.data.result.download_url) {
                let caption = `🎬 *YOUTUBE DOWNLOADER* 🎬\n\n`
                caption += `📝 *Title:* ${backupRes.data.result.title || videoTitle || 'YouTube Video'}`

                return await conn.sendMessage(from, { 
                    video: { url: backupRes.data.result.download_url }, 
                    caption: caption 
                }, { quoted: mek })
            }
        } catch (err) {
            console.log("Backup API 1 failed, trying backup API 2...")
        }

        // 3 වන API එක (Backup 2 - Shorts සඳහාම විශේෂයි)
        try {
            const backupApiUrl2 = `https://api.giftedtech.web.id/api/download/dlmp4?url=${encodeURIComponent(videoUrl)}`
            const backupRes2 = await axios.get(backupApiUrl2)

            if (backupRes2.data && backupRes2.data.success && backupRes2.data.result && backupRes2.data.result.download_url) {
                let caption = `🎬 *YOUTUBE DOWNLOADER* 🎬\n\n`
                caption += `📝 *Title:* ${backupRes2.data.result.title || videoTitle || 'YouTube Video'}`

                return await conn.sendMessage(from, { 
                    video: { url: backupRes2.data.result.download_url }, 
                    caption: caption 
                }, { quoted: mek })
            }
        } catch (err) {
            console.log("All APIs failed.")
        }

        return reply('❌ Shorts එක Download කිරීමට නොහැකි විය. කරුණාකර පසුව උත්සාහ කරන්න.')

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
