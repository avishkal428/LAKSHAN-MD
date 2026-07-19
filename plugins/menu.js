const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');

const menuSessions = new Map();
const startTime = Date.now();

setInterval(() => {
    for (const [key, session] of menuSessions) {
        if (Date.now() - session.timestamp > 300000) menuSessions.delete(key);
    }
}, 60000);

function formatRAMUsage() {
    const used  = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = process.memoryUsage().rss / 1024 / 1024;
    return `${used.toFixed(2)}MB / ${total.toFixed(0)}MB`;
}

function formatRuntime() {
    const ms      = Date.now() - startTime;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor(ms / 1000) % 60;
    return `${minutes}m ${seconds}s`;
}

const handleMenuReply = async (conn, msg) => {
    if (!msg?.message) return;

    const text = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ''
    ).trim();

    const selected = parseInt(text);
    if (isNaN(selected)) return;

    const from   = msg.key.remoteJid;
    const sender = msg.key.participant || from;

    const session = menuSessions.get(sender);
    if (!session)              return;
    if (session.from !== from) return;
    if (Date.now() - session.timestamp > 300000) {
        menuSessions.delete(sender);
        return;
    }

    if (selected < 1 || selected > session.categories.length) {
        await conn.sendMessage(from, {
            text: `❌ Please select between 1–${session.categories.length}`
        }, { quoted: msg });
        return;
    }

    menuSessions.delete(sender);

    const config           = await readEnv();
    const selectedCat      = session.categories[selected - 1];
    const categoryCommands = commands.filter(
        c => c.category === selectedCat.name && !c.dontAddCommandList
    );

    const categoryMenu = `
━━━━━━━━━━━━━━━━━━
*╭─「 ${selectedCat.title} 」*
*│📚 Commands:* ${categoryCommands.length}
*╰──────────●●►*
${categoryCommands.map(c => `➤ *${config.PREFIX}${c.pattern}*`).join('\n')}
━━━━━━━━━━━━━━━━━━
*© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝐋𝐀𝐊𝐒𝐇𝐀𝐍 𝐌𝐃*
`.trim();

    await conn.sendMessage(from, {
        image:   { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/uqofdi.jpg' },
        caption: categoryMenu,
        contextInfo: { mentionedJid: [sender] }
    }, { quoted: msg });
};

cmd({
    pattern:  'menu',
    desc:     'Show interactive command list',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushname = 'User', sender }) => {
    try {
        const config = await readEnv();
        if (!commands || !config) throw new Error('Missing dependencies');

        const categories = [
            { title: 'Main',     name: 'main',     emoji: '🏆' },
            { title: 'Owner',    name: 'owner',     emoji: '👑' },
            { title: 'Group',    name: 'group',     emoji: '👥' },
            { title: 'Download', name: 'download',  emoji: '⬇️' },
            { title: 'Search',   name: 'search',    emoji: '🔎' },
            { title: 'Convert',  name: 'convert',   emoji: '🔄' },
            { title: 'Movie',    name: 'movie',     emoji: '🎥' }
        ];

        const menuText = `
🌟 Hello, *${pushname}*!  
━━━━━━━━━━━━━━━━━━  
*╭─「 Commands Panel 」*  
*│🧬 RAM Usage:* ${formatRAMUsage()}  
*│🪼 Runtime:* ${formatRuntime()}  
*╰──────────●●►*  
━━━━━━━━━━━━━━━━━━  
🔰 MAIN MENU 🔰  
┏━━━━━━━━━━━━━┓  
${categories.map((cat, i) => `┃ ${i + 1} ${cat.emoji} ${cat.title}`).join('\n')}  
┗━━━━━━━━━━━━━┛  

💬 Reply with a number to choose an option!  

*© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝐋𝐀𝐊𝐒𝐇𝐀𝐍 𝐌𝐃*
`.trim();

        const sentMsg = await conn.sendMessage(from, {
            image:   { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/uqofdi.jpg' },
            caption: menuText,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

        menuSessions.set(sender, {
            timestamp: Date.now(),
            categories,
            messageId: sentMsg.key.id,
            from,
        });

        if (!conn._menuHandlerRegistered) {
            conn.ev.on('messages.upsert', ({ messages }) => {
                const msg = messages[0];
                if (msg && !msg.key.fromMe) handleMenuReply(conn, msg);
            });
            conn._menuHandlerRegistered = true;
        }

    } catch (e) {
        console.error('Menu Error:', e);
        await conn.sendMessage(from, {
            text: '❌ Failed to load menu. Please try again later.'
        }, { quoted: mek });
    }
});
