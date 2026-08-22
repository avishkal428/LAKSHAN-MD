const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { runtime, sleep } = require('../lib/functions');
const scraperThenkiri = require('liyanaarachchi-thenkiri-scrap');
const scraperAnime = require('liyanaarachchi-animeheavenme');
const { ytmp3, ytmp4, tiktok } = require("sadaslk-dlcore");
const yts = require("yt-search");
const axios = require('axios');
const os = require('os');
const { exec } = require("child_process");

// Global Active Sessions Map for Interactive Menu Response
if (!global.menuSessions) {
    global.menuSessions = new Map();
}

function formatRAMUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024;
    return `${used.toFixed(2)} MB / ${total.toFixed(0)} MB`;
}

async function getYoutube(query) {
    const isUrl = /(youtube\.com|youtu\.be)/i.test(query);
    if (isUrl) {
        const id = query.split("v=")[1] || query.split("/").pop();
        return await yts({ videoId: id });
    }
    const search = await yts(query);
    return search.videos.length ? search.videos[0] : null;
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

*© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳*
`.trim();

        const sentMsg = await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/2cs82r.jpg' },
            caption: menuText,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

        // Save active session
        global.menuSessions.set(sentMsg.key.id, {
            sender,
            from,
            categories
        });

        // Global Event Listener for Menu Replies
        if (!conn._interactiveMenuHandler) {
            conn._interactiveMenuHandler = true;

            conn.ev.on('messages.upsert', async ({ messages }) => {
                try {
                    const msg = messages[0];
                    if (!msg?.message) return; // 'fromMe' check removed to support Bot's own number (Self-chat)

                    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
                    const quotedId = contextInfo?.stanzaId;

                    if (!quotedId || !global.menuSessions.has(quotedId)) return;

                    const session = global.menuSessions.get(quotedId);
                    const msgSender = msg.key.participant || msg.key.remoteJid;

                    // Allow response if sender matches or if it is from the bot's own number
                    if (session.sender !== msgSender && msg.key.remoteJid !== session.sender && !msg.key.fromMe) return;

                    const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
                    const selected = parseInt(body);

                    if (isNaN(selected) || selected < 1 || selected > session.categories.length) {
                        return await conn.sendMessage(msg.key.remoteJid, {
                            text: `❌ Invalid choice! Please reply with a number between 1 and ${session.categories.length}.`
                        }, { quoted: msg });
                    }

                    const selectedCat = session.categories[selected - 1];

                    // Unique commands display
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
*© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳*
`.trim();

                    await conn.sendMessage(msg.key.remoteJid, {
                        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/2cs82r.jpg' },
                        caption: subMenu
                    }, { quoted: msg });

                } catch (err) {
                    console.error("Menu Response Error:", err);
                }
            });
        }

    } catch (e) {
        console.error('Menu Command Error:', e);
        await conn.sendMessage(from, { text: '❌ Failed to load main menu.' }, { quoted: mek });
    }
});

// ==========================================
// 2. MAIN & SYSTEM COMMANDS
// ==========================================
cmd({
    pattern: "system",
    alias: ["status", "botinfo"],
    desc: "Displays system info like RAM usage, CPU, and Uptime",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const status = `
╭─── *🖥️ SYSTEM STATUS 🖥️* ───╮
│ ⏰ *Uptime*: ${runtime(process.uptime())}
│ 💾 *RAM Usage*: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│ ⚙️ *Platform*: ${os.platform()} (${os.arch()})
│ 🖱️ *CPU*: ${os.cpus()[0]?.model || 'Unknown'}
╰───────────────────╯
*© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳*`;
    await reply(status);
});

cmd({
    pattern: "ping",
    alias: ["speed"],
    desc: "Checks bot server latency and response speed",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const start = performance.now();
    await reply(`🏓 Pong! Latency: ${(performance.now() - start).toFixed(0)} ms`);
});

cmd({
    pattern: "owner",
    alias: ["dev"],
    desc: "Displays bot developer contact information",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const config = await readEnv();
    await conn.sendMessage(from, { 
        text: `👑 *Bot Developer:* ${config.OWNER_NAME || '𝐀𝐕𝐈𝐒𝐇𝐊𝐀 & 𝐀𝐊𝐀𝐒𝐇'}\n📞 *Contact Number:* +${config.OWNER_NUMBER || '94725337806'}` 
    }, { quoted: mek });
});

// ==========================================
// 3. DOWNLOAD COMMANDS
// ==========================================
cmd({
    pattern: "ytmp3",
    alias: ["song"],
    desc: "Downloads MP3 audio directly from YouTube",
    category: "download",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    if (!q) return reply("🎵 Please provide a song name or YouTube link!");
    const video = await getYoutube(q);
    if (!video) return reply("❌ Song/Video not found on YouTube!");
    
    reply("⬇️ Downloading MP3 audio from YouTube...");
    const data = await ytmp3(video.url);
    if (!data?.url) return reply("❌ Download failed!");

    await bot.sendMessage(from, { 
        audio: { url: data.url }, 
        mimetype: "audio/mpeg" 
    }, { quoted: mek });
});

cmd({
    pattern: "ytmp4",
    alias: ["video"],
    desc: "Downloads MP4 video directly from YouTube",
    category: "download",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    if (!q) return reply("🎬 Please provide a video name or YouTube link!");
    const video = await getYoutube(q);
    if (!video) return reply("❌ Video not found on YouTube!");

    reply("⬇️ Downloading video from YouTube...");
    const data = await ytmp4(video.url, { format: "mp4", videoQuality: "720" });
    if (!data?.url) return reply("❌ Download failed!");

    await bot.sendMessage(from, { 
        video: { url: data.url }, 
        mimetype: "video/mp4", 
        caption: `🎬 *${video.title}*\n🔗 Source: YouTube` 
    }, { quoted: mek });
});

cmd({
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Downloads watermark-free videos directly from TikTok",
    category: "download",
    filename: __filename
}, async (bot, mek, m, { from, q, reply }) => {
    if (!q) return reply("📱 Please send a valid TikTok video URL!");
    
    reply("⬇️ Downloading TikTok video...");
    const data = await tiktok(q);
    if (!data?.no_watermark) return reply("❌ Unable to fetch TikTok video!");

    await bot.sendMessage(from, { 
        video: { url: data.no_watermark }, 
        caption: `🎵 *${data.title || "TikTok Video"}*\n👤 Author: ${data.author || "Unknown"}\n🔗 Source: TikTok` 
    }, { quoted: mek });
});

// ==========================================
// 4. MOVIE & ANIME COMMANDS (WITH SITE NAMES)
// ==========================================
cmd({
    pattern: "thenkiri",
    alias: ["tk", "movie"],
    desc: "Searches and downloads movies from Site: Thenkiri.com",
    category: "movie",
    filename: __filename
}, async (socket, msg, m, { from, args }) => {
    if (!args.length) return socket.sendMessage(from, { text: "⚠️ Please enter a movie name to search on Thenkiri." });
    
    try {
        const results = await scraperThenkiri.searchMovie(args.join(' '));
        if (!results?.length) return socket.sendMessage(from, { text: "😞 No movies found on Thenkiri!" });

        let text = "*🎬 MOVIE SEARCH (Site: Thenkiri.com) 🎬*\n\n";
        results.slice(0, 10).forEach((item, i) => {
            text += `*${i + 1}.* ${item.title || item.name}\n`;
        });
        text += `\n🌐 Download Source Site: https://thenkiri.com`;

        await socket.sendMessage(from, { text }, { quoted: msg });
    } catch (e) {
        await socket.sendMessage(from, { text: `❌ Thenkiri Error: ${e.message}` }, { quoted: msg });
    }
});

cmd({
    pattern: "anime",
    alias: ["animedl"],
    desc: "Searches and downloads anime from Site: AnimeHeaven.me",
    category: "movie",
    filename: __filename
}, async (socket, msg, m, { from, args }) => {
    if (!args.length) return socket.sendMessage(from, { text: "⚠️ Please enter an Anime name to search." });

    try {
        const results = await scraperAnime.searchAnime(args.join(' '));
        if (!results?.length) return socket.sendMessage(from, { text: "😞 No anime found on AnimeHeaven!" });

        let text = "*🎏 ANIME SEARCH (Site: AnimeHeaven.me) 🎏*\n\n";
        results.slice(0, 10).forEach((item, i) => {
            text += `*${i + 1}.* ${item.title || item.name}\n`;
        });
        text += `\n🌐 Download Source Site: https://animeheaven.me`;

        await socket.sendMessage(from, { text }, { quoted: msg });
    } catch (e) {
        await socket.sendMessage(from, { text: `❌ Anime Error: ${e.message}` }, { quoted: msg });
    }
});

// ==========================================
// 5. UTILITY & OWNER COMMANDS
// ==========================================
cmd({
    pattern: "send",
    alias: ["save", "sendme"],
    desc: "Forwards quoted media or message directly back to user chat",
    category: "utility",
    filename: __filename
}, async (client, message, match, { from }) => {
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return client.sendMessage(from, { text: "*🍁 Reply to a message to send/save!*" }, { quoted: message });
    
    await client.sendMessage(from, { 
        forward: { key: message.message.extendedTextMessage.contextInfo, message: quotedMsg } 
    }, { quoted: message });
});

cmd({
    pattern: "restart",
    desc: "Restarts the WhatsApp Bot process using PM2",
    category: "owner",
    filename: __filename
}, async(conn, mek, m, { reply }) => {
    await reply("🔄 Restarting bot system...");
    exec("pm2 restart all");
});
