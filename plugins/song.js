const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

cmd({
    pattern: "song",
    alias: ["ytmp3", "play"],
    desc: "Download YouTube Audio",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('🎵 කරුණාකර සින්දුවේ නම හෝ YouTube Link එකක් ලබාදෙන්න!')

        await reply('🎶 *Searching & Downloading Audio...*')

        let videoUrl = q
        let videoTitle = ''

        // YouTube Shorts URL එකක් ආවොත් Normal Watch URL එකට මාරු කිරීම
        if (videoUrl.includes('youtube.com/shorts/')) {
            videoUrl = videoUrl.replace('youtube.com/shorts/', 'youtube.com/watch?v=')
        }

        // Link එකක් නෙමෙයි නම් yts මඟින් Search කිරීම
        if (!q.startsWith('http://') && !q.startsWith('https://')) {
            const search = await yts(q)
            const data = search.videos[0]
            if (!data) return reply('❌ සින්දුව සොයා ගැනීමට නොහැකි විය.')
            videoUrl = data.url
            videoTitle = data.title
        }

        const apiUrl = `https://www.ominisave.store/api/ytmp3?url=${encodeURIComponent(videoUrl)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data || data.status === false || !data.result) {
            return reply('❌ සින්දුව ලබා ගැනීමට නොහැකි විය. API එකේ දෝෂයක් පවතී.')
        }

        const audio = data.result
        const downloadLink = audio.downloadURL || audio.url

        if (!downloadLink) {
            return reply('❌ Download Link එක සොයා ගැනීමට නොහැකි විය.')
        }

        let caption = `🎵 *YOUTUBE AUDIO DOWNLOADER* 🎵\n\n`
        caption += `📝 *Title:* ${audio.title || videoTitle || 'YouTube Song'}\n\n`
        caption += `👨‍💻 *Created By:* ${data.creator || '@SaviyaKolla'}`

        // Audio Message එකක් ලෙස Send කිරීම
        await conn.sendMessage(from, { 
            audio: { url: downloadLink }, 
            mimetype: 'audio/mp4',
            fileName: `${audio.title || 'song'}.mp3`
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})

