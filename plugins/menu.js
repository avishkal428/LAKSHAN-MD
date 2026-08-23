const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { exec } = require("child_process");

const FOOTER = "© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳";

if (!global.menuSessions) global.menuSessions = new Map();

function formatRAMUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024;
    return `${used.toFixed(2)} MB / ${total.toFixed(0)} MB`;
}

// ==========================================
// 1. INTERACTIVE MENU COMMAND
// ==========================================
cmd({
    pattern: 'menu',
    alias: ['panel', 'list', 'help'],
    desc: 'Displays the interactive main menu list',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushname = 'User', sender }) => {
    try {
        const config = await readEnv();

        const categories = [
            { title: 'Main',     name: 'main',     emoji: '🏆' },
            { title: 'Owner',    name: 'owner',    emoji: '👑' },
            { title: 'Group',    name: 'group',    emoji: '👥' },
            { title: 'Download', name: 'download', emoji: '⬇️' },
            { title: 'Search',   name: 'search',   emoji: '🔎' },
            { title: 'Convert',  name: 'convert',  emoji: '🔄' },
            { title: 'Movie',    name: 'movie',    emoji: '🎥' },
            { title: 'Utility',  name: 'utility',  emoji: '🛠️' },
            { title: 'Tools',    name: 'tools',    emoji: '⚙️' }
        ];

        const menuText = `
🌟 Hello, *${pushname}*!  
━━━━━━━━━━━━━━━━━━  
*╭─「 Commands Panel 」*  
*│🧬 RAM Usage:* ${formatRAMUsage()}  
*│🪼 Uptime:* ${runtime(process.uptime())}  
*╰──────────●●►*  
━━━━━━━━━━━━━━━━━━  
🔰 MAIN MENU 🔰  
┏━━━━━━━━━━━━━┓  
${categories.map((cat, i) => `┃ ${i + 1} ${cat.emoji} ${cat.title}`).join('\n')}  
┗━━━━━━━━━━━━━┛  

💬 Reply with a category number to get command list!  

*${FOOTER}*
`.trim();

        const sentMsg = await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/uqofdi.jpg' },
            caption: menuText,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

        global.menuSessions.set(from, {
            msgId: sentMsg.key.id,
            sender,
            categories
        });

    } catch (e) {
        console.error('Menu Command Error:', e);
        await conn.sendMessage(from, { text: '❌ Failed to load main menu.' }, { quoted: mek });
    }
});

// ==========================================
// 2. MAIN MENU REPLY LISTENER ONLY
// ==========================================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, isCmd }) => {
    try {
        if (isCmd) return;
        if (!global.menuSessions.has(from)) return;

        const textMsg = body ? body.trim() : "";
        if (!textMsg || isNaN(textMsg)) return;

        const choiceIndex = parseInt(textMsg) - 1;
        const menuSession = global.menuSessions.get(from);
        const config = await readEnv();

        if (choiceIndex < 0 || choiceIndex >= menuSession.categories.length) return;

        const selectedCat = menuSession.categories[choiceIndex];
        const filteredCmds = commands.filter(c => c.category === selectedCat.name && !c.dontAddCommandList);
        const uniqueCmds = Array.from(new Map(filteredCmds.map(item => [item['pattern'], item])).values());

        const subMenu = `
━━━━━━━━━━━━━━━━━━
*╭─「 ${selectedCat.emoji} ${selectedCat.title} Commands 」*
*│📚 Total Commands:* ${uniqueCmds.length}
*╰──────────●●►*

${uniqueCmds.length > 0 
    ? uniqueCmds.map(c => `➤ *${config.PREFIX || '.'}${c.pattern}* - _${c.desc || 'No description'}_`).join('\n') 
    : '⚠️ No commands found in this category.'}

━━━━━━━━━━━━━━━━━━
*${FOOTER}*
`.trim();

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/uqofdi.jpg' },
            caption: subMenu
        }, { quoted: mek });

        global.menuSessions.delete(from);

    } catch (err) {
        console.error("Menu Listener Error:", err);
    }
});

// ==========================================
// 3. SYSTEM COMMANDS
// ==========================================
cmd({
    pattern: "system",
    alias: ["status", "botinfo"],
    desc: "Displays system info",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const status = `
╭─── *🖥️ SYSTEM STATUS 🖥️* ───╮
│ ⏰ *Uptime*: ${runtime(process.uptime())}
│ 💾 *RAM Usage*: ${formatRAMUsage()}
│ ⚙️ *Platform*: ${os.platform()} (${os.arch()})
╰───────────────────╯
*${FOOTER}*`;
    await reply(status);
});

cmd({
    pattern: "ping",
    alias: ["speed"],
    desc: "Checks latency",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const start = Date.now();
    await reply(`🏓 Pong! Latency: ${Date.now() - start} ms`);
});

cmd({
    pattern: "restart",
    desc: "Restarts bot",
    category: "owner",
    filename: __filename
}, async(conn, mek, m, { reply }) => {
    await reply("🔄 Restarting bot system...");
    exec("pm2 restart all");
});
