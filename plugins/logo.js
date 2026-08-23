const { cmd } = require('../command')
const axios = require('axios')

// ominisave.store එකේ තියෙන Logo Types
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
            listText += `💡 *උදාහරණ:* \n.logo neon Avishka\n.logo hacker Lakshan\n\n`
            listText += `✨ *ලබාගත හැකි Logo Types (${validTypes.length}):*\n`
            listText += validTypes.map(t => `• ${t}`).join('\n')
            return reply(listText)
        }

        // Type එක සහ Text එක වෙන් කරගැනීම
        const args = q.trim().split(/\s+/)
        const type = args[0].toLowerCase()
        const text = args.slice(1).join(' ')

        // Type එක Valid ද කියා බලයි
        if (!validTypes.includes(type)) {
            return reply(`❌ *වැරදි Logo Type එකක්!*\n\nනිවැරදි Type එකක් තෝරාගන්න. (උදා: .logo neon YourName)\n\nලබාගත හැකි Types බැලීමට *.logo* ලෙස විතරක් Send කරන්න.`)
        }

        if (!text) {
            return reply(`⚠️ කරුණාකර Logo එකට ඇතුළත් කිරීමට නමක්/වචනයක් ලබාදෙන්න!\n\nඋදාහරණ: *.logo ${type} Avishka*`)
        }

        await reply('🎨 *Creating your Logo... Please wait!*')

        // API එකෙන් Logo එක Request කිරීම
        const apiUrl = `https://www.ominisave.store/api/logo?type=${encodeURIComponent(type)}&text=${encodeURIComponent(text)}`
        const res = await axios.get(apiUrl)
        const data = res.data

        if (!data || data.status === false || !data.result) {
            return reply('❌ Logo එක සදා ගැනීමට නොහැකි විය. API එකේ දෝෂයක් පවතී.')
        }

        // Logo Image එක ගන්නා ස්ථානය (result / url / result.url)
        const logoUrl = typeof data.result === 'string' ? data.result : (data.result.url || data.result.image)

        if (!logoUrl) {
            return reply('❌ Logo Image URL එක සොයා ගැනීමට නොහැකි විය.')
        }

        let caption = `🎨 *LOGO CREATOR* 🎨\n\n`
        caption += `📝 *Text:* ${text}\n`
        caption += `✨ *Style:* ${type.toUpperCase()}\n\n`
        caption += `👨‍💻 *Created By:* ᴀᴠɪꜱʜᴋᴀ ヤ`

        // Photo එක Send කිරීම
        await conn.sendMessage(from, { 
            image: { url: logoUrl }, 
            caption: caption 
        }, { quoted: mek })

    } catch (e) {
        console.error(e)
        reply(`❌ Error: ${e.message}`)
    }
})

