const { cmd } = require('../command')
const axios = require('axios')

const validTypes = [
    "neon", "neon2", "fire2", "glitch", "hacker", "futuristic", 
    "thunder", "devil", "fire", "ice", "snow", "lava", "metal", 
    "gold", "silver", "glossy", "blackpink", "transformer", "horror", 
    "blood", "joker", "galaxy", "space", "cloud", "sand", "stone", 
    "magma", "gradient", "light", "paper", "watercolor", "candy", 
    "christmas", "luxury", "leaf", "summer", "circuit", "block3d", 
    "cartoon", "chrome", "frozen"
]

cmd({
    pattern: "logo",
    alias: ["logomaker", "makelogo"],
    desc: "Create cool text logos and effects",
    category: "maker",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            let listText = `🎨 *LOGO MAKER MENU* 🎨\n\n`
            listText += `📌 *භාවිතා කරන ආකාරය:* \n.logo <type> <text>\n\n`
            listText += `💡 *උදාහරණ:* \n.logo cartoon Avishka\n.logo neon Lakshan\n\n`
            listText += `✨ *ලබාගත හැකි Logo Types (${validTypes.length}):*\n`
            listText += validTypes.map(t => `• ${t}`).join('\n')
            return reply(listText)
        }

        const args = q.trim().split(/\s+/)
        const type = args[0].toLowerCase()
        const text = args.slice(1).join(' ')

        if (!validTypes.includes(type)) {
            return reply(`❌ *වැරදි Logo Type එකක්!*\n\nලබාගත හැකි Types බැලීමට *.logo* ලෙස යවන්න.`)
        }

        if (!text) {
            return reply(`⚠️ කරුණාකර Logo එකට ඇතුළත් කිරීමට නමක් ලබාදෙන්න!\n\nඋදාහරණ: *.logo ${type} Avishka*`)
        }

        await reply('🎨 *Creating your Logo... Please wait!*')

        let logoUrl = null

        // 1. Primary API (Ominisave)
        try {
            const apiUrl = `https://www.ominisave.store/api/logo?type=${encodeURIComponent(type)}&text=${encodeURIComponent(text)}`
            const res = await axios.get(apiUrl, { timeout: 10000 })
            
            if (res.data && res.data.status) {
                if (typeof res.data.result === 'string') {
                    logoUrl = res.data.result
                } else if (res.data.result && (res.data.result.url || res.data.result.download_url)) {
                    logoUrl = res.data.result.url || res.data.result.download_url
                }
            }
        } catch (err) {
            console.log("Ominisave Logo API failed, trying fallback...")
        }

        // 2. Backup API (Darksadas / Ephoto Scraper)
        if (!logoUrl) {
            try {
                const fallbackUrl = `https://api.darksadasyt.mobi/site/ephoto?type=${encodeURIComponent(type)}&text=${encodeURIComponent(text)}`
                const res2 = await axios.get(fallbackUrl, { timeout: 10000 })
                if (res2.data && res2.data.result) {
                    logoUrl = res2.data.result.url || res2.data.result
                }
            } catch (err2) {
                console.log("Fallback Logo API failed")
            }
        }

        if (!logoUrl) {
            return reply('❌ Logo එක සදා ගැනීමට නොහැකි විය. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.')
        }

        let caption = `🎨 *LOGO CREATOR* 🎨\n\n`
        caption += `📝 *Text:* ${text}\n`
        caption += `✨ *Style:* ${type.toUpperCase()}\n\n`
        caption += `👨‍💻 *Created By:* ᴀᴠɪꜱʜᴋᴀ ヤ`

        await conn.sendMessage(from, { 
            image: { url: logoUrl }, 
            caption: caption 
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})
