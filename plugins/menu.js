const { readEnv } = ('../lib/database');
const { cmd, commands } = require('../command');

// Track bot start time for uptime
const startTime = Date.now();

// Format RAM usage
function formatRAMUsage() {
    const requireused = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = process.memoryUsage().rss / 1024 / 1024;
    return `${used.toFixed(2)}MB / ${total.toFixed(0)}MB`;
}

// Format uptime
function formatRuntime() {
    const ms = Date.now() - startTime;
    const hours   = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

cmd(
    {
        pattern: 'menu',
        desc: 'Show all bot commands',
        category: 'main',
        filename: __filename,
    },
    async (conn, mek, m, { from, pushname = 'User', reply }) => {
        try {
            const config = await readEnv();
            if (!config) throw new Error('Config (readEnv) returned null');
            if (!commands || !Array.isArray(commands)) throw new Error('commands list is not available');

            const PREFIX = config.PREFIX || '.';

            // ─── Category definitions ────────────────────────────────────────────
            const categories = [
                { name: 'main',     title: 'Main',     emoji: '🏆' },
                { name: 'owner',    title: 'Owner',    emoji: '👑' },
                { name: 'group',    title: 'Group',    emoji: '👥' },
                { name: 'download', title: 'Download', emoji: '⬇️'  },
                { name: 'search',   title: 'Search',   emoji: '🔎' },
                { name: 'convert',  title: 'Convert',  emoji: '🔄' },
                { name: 'movie',    title: 'Movie',    emoji: '🎥' },
            ];

            // ─── Build menu text ─────────────────────────────────────────────────
            let menuText = '';
            menuText += `╔══════════════════════╗\n`;
            menuText += `║   🤖 *LAKSHAN  MD*   ║\n`;
            menuText += `╚══════════════════════╝\n\n`;
            menuText += `👤 *User :* ${pushname}\n`;
            menuText += `🧬 *RAM  :* ${formatRAMUsage()}\n`;
            menuText += `⏱️  *Up   :* ${formatRuntime()}\n`;
            menuText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            let totalCmds = 0;

            for (const cat of categories) {
                const catCmds = commands.filter(
                    (c) => c.category === cat.name && !c.dontAddCommandList && c.pattern
                );
                if (catCmds.length === 0) continue;

                totalCmds += catCmds.length;

                menuText += `*╭─「 ${cat.emoji} ${cat.title} 」*\n`;
                for (const c of catCmds) {
                    menuText += `*│* ➤ *${PREFIX}${c.pattern}*\n`;
                }
                menuText += `*╰──────────●●►*\n\n`;
            }

            menuText += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            menuText += `📦 *Total Commands:* ${totalCmds}\n`;
            menuText += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            menuText += `*© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝐋𝐀𝐊𝐒𝐇𝐀𝐍 𝐌𝐃*`;

            // ─── Send message (image preferred, text fallback) ───────────────────
            const imageUrl =
                config.MENU_IMAGE_URL && config.MENU_IMAGE_URL.startsWith('http')
                    ? config.MENU_IMAGE_URL
                    : 'https://files.catbox.moe/lkvdvv.jpg';

            try {
                await conn.sendMessage(
                    from,
                    {
                        image: { url: imageUrl },
                        caption: menuText,
                        contextInfo: { mentionedJid: [m.sender] },
                    },
                    { quoted: mek }
                );
            } catch (imgErr) {
                // Image failed (URL unreachable, etc.) — fall back to plain text
                console.warn('Menu image send failed, falling back to text:', imgErr.message);
                await conn.sendMessage(
                    from,
                    {
                        text: menuText,
                        contextInfo: { mentionedJid: [m.sender] },
                    },
                    { quoted: mek }
                );
            }
        } catch (e) {
            console.error('Menu Error:', e);
            reply(`❌ *Menu Error:* ${e.message}`);
        }
    }
);

