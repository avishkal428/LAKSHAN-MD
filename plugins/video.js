const { cmd } = require('../command')
const ytdl = require('@distube/ytdl-core')
const yts = require('yt-search')

// Active Quality Request තබා ගැනීමට Map එකක්
const videoRequests = new Map()

// YouTube Link එකෙන් ID වෙන් කරගැනීම
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

        await reply('🔍 *Fetching Quality Options...*')

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

        // YouTube Video Info ලබා ගැනීම
        const info = await ytdl.getInfo(videoUrl)
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio')

        if (!formats || formats.length === 0) {
            return reply('❌ Download කළ හැකි Quality Options සොයා ගැනීමට නොහැකි විය.')
        }

        // Available Qualities වෙන් කර ගැනීම
        let qualityMap = new Map()
        let menuText = `🎬 *YOUTUBE VIDEO DOWNLOADER* 🎬\n\n`
        menuText += `📝 *Title:* ${info.videoDetails.title}\n`
        menuText += `⏱️ *Duration:* ${info.videoDetails.lengthSeconds}s\n\n`
        menuText += `*කරුණාකර ඔබට අවශ්‍ය Quality එකේ අංකය Reply කරන්න:* \n\n`

        let index = 1
        formats.forEach(f => {
            if (f.qualityLabel && !qualityMap.has(f.qualityLabel)) {
                qualityMap.set(index.toString(), {
                    quality: f.qualityLabel,
                    url: f.url
                })
                menuText += `*${index}* - ${f.qualityLabel}\n`
                index++
            }
        })

        const sentMsg = await conn.sendMessage(from, { text: menuText }, { quoted: mek })

        // Data එක Save කිරීම
        videoRequests.set(from, {
            options: qualityMap,
            title: info.videoDetails.title,
            messageId: sentMsg.key.id
        })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})

// User Reply එක Catch කර Video එක Send කිරීම
cmd({
    on: "text"
},
async (conn, mek, m, { from, body, reply }) => {
    if (videoRequests.has(from)) {
        const reqData = videoRequests.get(from)
        const choice = body.trim()

        if (reqData.options.has(choice)) {
            const selected = reqData.options.get(choice)

            await reply(`⬇️ *Downloading ${selected.quality} Video...*`)

            let caption = `🎬 *${reqData.title}*\n📊 *Quality:* ${selected.quality}`

            await conn.sendMessage(from, { 
                video: { url: selected.url }, 
                caption: caption 
            }, { quoted: mek })

            videoRequests.delete(from) // Request එක ඉවත් කිරීම
        }
    }
})
