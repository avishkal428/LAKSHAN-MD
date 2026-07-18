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
ðŸŒŸ *Hð—˜ð—Ÿð—Ÿð—¢, *${pushname}*!  
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”  
*â•­â”€ã€Œ ð™±ð™¾ðšƒ ðš‚ðšƒð™°ðšƒðš„ðš‚ ã€*  
*â”‚ðŸ§¬ ðš‚ðšƒð™°ðšƒðš„ðš‚ -* Online  
*â”‚ðŸª¼ ðšð™°ð™¼ ðš„ðš‚ð™°ð™¶ð™´ -* ${formatRAMUsage()}  
*â”‚â° ðšðš„ð™½ðšƒð™¸ð™¼ð™´ -* ${formatRuntime()}  
*â”‚ðŸ¤– ð™±ð™¾ðšƒ ð™½ð™°ð™¼ð™´ -* ${config.BOT_NAME || 'LAKSHAN MD'}  
*â”‚ðŸ‘‘ ð™¾ðš†ð™½ð™´ðš -* ${config.OWNER_NAME ||'LIYANAARACHCHI AVISHKA'}  
*â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â—â—â–º*  
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”  
ðŸ”° *I'M ALIVE AND READY!* ðŸ”°  
ðŸ’¬ Type *.menu* to see all commands!  

*Â© ð™¿ð™¾ðš†ð™´ðšð™³ ð™±ðšˆ ð‹ð€ðŠð’ð‡ð€ð ðŒðƒ*
`;

        const imageUrl = config.MENU_IMAGE_URL || 'https://files.catbox.moe/lkvdvv.jpg';
        await conn.sendMessage(from, { 
            image: { url: imageUrl },
            caption: aliveText,
            contextInfo: {
                mentionedJid: [sender]
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: 'âœ”ï¸', key: mek.key } });

    } catch (e) {
        console.error("Alive Command Error:", e);
        await conn.sendMessage(from, { react: { text: 'âŒ', key: mek.key } });
        await reply(`âŒ *Failed to load bot status:* ${e.message || "Error!"}`);
    }
});
