const { cmd } = require('../command')
const axios = require('axios')

// Command Map එක තාවකාලිකව Links තබා ගැනීමට
const userRequests = new Map()

cmd({
    pattern: "ytmp4",
    alias: ["ytv", "video"],
    desc: "Download YouTube Videos with Quality Selection",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply('❌ කරුණාකර YouTube link එකක් ලබාදෙන්න!\n\n*Example:* .ytmp4 https://www.youtube.com/watch?v=...')

        await reply('🔍 *Fetching video details...*')

        const apiUrl = `https://www.ominisave.store/api/ytmp4?url=${encodeURIComponent(q)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data || data.status === false || !data.result) {
            const errorMsg = data?.error || 'වීඩියෝ එක ලබා ගැනීමට නොහැකි විය.'
            return reply(`❌ API Error: ${errorMsg}`)
        }

        const video = data.result
        
        // Quality Selection Menu එක සැකසීම
        let menuText = `🎬 *YOUTUBE VIDEO DOWNLOADER* 🎬\n\n`
        menuText += `📝 *Title:* ${video.title || 'YouTube Video'}\n\n`
        menuText += `*කරුණාකර ඔබට අවශ්‍ය Quality එකේ අංකය Reply කරන්න:* \n\n`
        menuText += `1️⃣ 360p (Low Quality)\n`
        menuText += `2️⃣ 480p (Medium Quality)\n`
        menuText += `3️⃣ 720p (HD Quality)\n`
        menuText += `4️⃣ 1080p (Full HD Quality)\n\n`
        menuText += `👨‍💻 *Created By:* ${data.creator || '@SaviyaKolla'}`

        const sentMsg = await conn.sendMessage(from, { text: menuText }, { quoted: mek })

        // Data එක Temporary Save කිරීම
        userRequests.set(from, {
            url: video.downloadLink || video.url,
            title: video.title,
            messageId: sentMsg.key.id
        })

    } catch (e) {
        console.error(e)
        reply('❌ Download කිරීමට නොහැකි විය. API Server එකෙහි දෝෂයක් පවතී.')
    }
})

// Reply එක Handle කිරීම සඳහා Listener එකක් (Index / Message Handler හරහා හෝ කෙලින්ම catch කිරීම)
cmd({
    on: "text"
},
async (conn, mek, m, { from, body, reply }) => {
    if (userRequests.has(from)) {
        const reqData = userRequests.get(from)
        const choice = body.trim()

        let selectedQuality = ""
        if (choice === "1") selectedQuality = "360p"
        else if (choice === "2") selectedQuality = "480p"
        else if (choice === "3") selectedQuality = "720p"
        else if (choice === "4") selectedQuality = "1080p"

        if (selectedQuality) {
            await reply(`⬇️ *Downloading Video in ${selectedQuality}...*`)

            let caption = `🎬 *${reqData.title || 'YouTube Video'}*\n`
            caption += `📊 *Quality:* ${selectedQuality}`

            await conn.sendMessage(from, { 
                video: { url: reqData.url }, 
                caption: caption 
            }, { quoted: mek })

            userRequests.delete(from) // Clear Memory
        }
    }
})

