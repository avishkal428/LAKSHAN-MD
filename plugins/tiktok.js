const { cmd, commands } = require('../command')
const axios = require('axios')

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok Videos",
    category: "download",
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return reply('❌ කරුණාකර TikTok link එකක් ලබාදෙන්න!\n\nExample: .tiktok https://vt.tiktok.com/ZSrGd2UFs/')

        reply('⬇️ *Downloading TikTok video...*')

        const apiUrl = `https://www.ominisave.store/api/tiktok?url=${encodeURIComponent(q)}`
        const response = await axios.get(apiUrl)
        const res = response.data

        if (!res.status || !res.downloads) {
            return reply('❌ වීඩියෝ එක සොයා ගැනීමට නොහැකි විය. Link එක නැවත පරීක්ෂා කරන්න.')
        }

        let caption = `🎵 *TIKTOK DOWNLOADER* 🎵\n\n`
        caption += `👤 *Author:* ${res.author || 'N/A'}\n`
        caption += `📝 *Title:* ${res.title || 'No Title'}\n\n`
        caption += `👁️ *Views:* ${res.stats?.views?.toLocaleString() || 0}\n`
        caption += `❤️ *Likes:* ${res.stats?.likes?.toLocaleString() || 0}\n\n`
        caption += `👨‍💻 *Created By:* ${res.creator || '@SaviyaKolla'}`

        // Send Video
        await conn.sendMessage(from, { 
            video: { url: res.downloads.video }, 
            caption: caption 
        }, { quoted: mek })

        // Send Audio if available
        if (res.downloads.music) {
            await conn.sendMessage(from, { 
                audio: { url: res.downloads.music }, 
                mimetype: 'audio/mp4',
                fileName: 'tiktok.mp3'
            }, { quoted: mek })
        }

    } catch (e) {
        console.log(e)
        reply(`❌ Error එකක් ආවා: ${e.message}`)
    }
})
