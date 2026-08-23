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
            listText += `💡 *උදාහරණ:* \n.logo cartoon Avishka\n.logo chrome Avis\n\n`
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

        // Working High-Speed Endpoints
        const apis = [
            `https://api.giftedtech.my.id/api/maker/ephoto-1?text=${encodeURIComponent(text)}&type=${encodeURIComponent(type)}`,
            `https://api.siputzx.my.id/api/m/ephoto?text=${encodeURIComponent(text)}&style=${encodeURIComponent(type)}`,
            `https://api.vreden.web.id/api/ephoto?text=${encodeURIComponent(text)}&type=${encodeURIComponent(type)}`
        ]

        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 12000 })
                if (res.data) {
                    if (res.data.result && typeof res.data.result === 'string') {
                        logoUrl = res.data.result
                        break
                    } else if (res.data.result && (res.data.result.url || res.data.result.image)) {
                        logoUrl = res.data.result.url || res.data.result.image
                        break
                    } else if (res.data.url) {
                        logoUrl = res.data.url
                        break
                    }
                }
            } catch (err) {
                console.log(`Logo Endpoint Failed: ${api}`)
            }
        }

        if (!logoUrl) {
            return reply('❌ Logo එක සදා ගැනීමට නොහැකි විය. කරුණාකර වෙනත් Style එකක් හෝ මොහොතකින් නැවත උත්සාහ කරන්න.')
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
