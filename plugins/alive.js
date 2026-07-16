const { readEnv } = require('../lib/database');
const { cmd } = require('../command');

// Track bot start time
const startTime = Date.now();

// Format RAM usage
function formatRAMUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = process.memoryUsage().rss / 1024 / 1024;
    return `${used.toFixed(2)}MB / ${total.toFixed(0)}MB`;
}

// Format runtime
function formatRuntime() {
    const ms = Date.now() - startTime;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor(ms / 1000) % 60;
    return `${minutes} minutes, ${seconds} seconds`;
}

cmd({
    pattern: "alive",
    desc: "Show bot status with a stylish menu",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname = 'User', reply, sender }) => {
    try {
        const config = await readEnv();
        if (!config) throw new Error("Missing configuration");

        const aliveText = `
🌟 *H𝗘𝗟𝗟𝗢, *${pushname}*!  
━━━━━━━━━━━━━━━━━━  
*╭─「 𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂 」*  
*│🧬 𝚂𝚃𝙰𝚃𝚄𝚂 -* Online  
*│🪼 𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴 -* ${formatRAMUsage()}  
*│⏰ 𝚁𝚄𝙽𝚃𝙸𝙼𝙴 -* ${formatRuntime()}  
*│🤖 𝙱𝙾𝚃 𝙽𝙰𝙼𝙴 -* ${config.BOT_NAME || 'LAKSHAN MD'}  
*│👑 𝙾𝚆𝙽𝙴𝚁 -* ${config.OWNER_NAME ||'LIYANAARACHCHI AVISHKA'}  
*╰──────────●●►*  
━━━━━━━━━━━━━━━━━━  
🔰 *I'M ALIVE AND READY!* 🔰  
💬 Type *.menu* to see all commands!  

*© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝐋𝐀𝐊𝐒𝐇𝐀𝐍 𝐌𝐃*
`;

        const imageUrl = config.MENU_IMAGE_URL || 'https://ik.imagekit.io/6ilngyaqa/1752148389745-1000386145_W78uElpLF2.jpg';
        await conn.sendMessage(from, { 
            image: { url: imageUrl },
            caption: aliveText,
            contextInfo: {
                mentionedJid: [sender]
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        console.error("Alive Command Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ *Failed to load bot status:* ${e.message || "Error!"}`);
    }
});
