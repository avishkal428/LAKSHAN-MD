const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { runtime, sleep } = require('../lib/functions');
const scraperThenkiri = require('liyanaarachchi-thenkiri-scrap');
const scraperAnime = require('liyanaarachchi-animeheavenme');
const axios = require('axios');
const os = require('os');
const { exec } = require("child_process");

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const FOOTER = "© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳";

// Global Active Sessions Maps
if (!global.menuSessions) global.menuSessions = new Map();
if (!global.thenkiriSessions) global.thenkiriSessions = new Map();

function formatRAMUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024;
    return `${used.toFixed(2)} MB / ${total.toFixed(0)} MB`;
}

// Helper: Fetch TMDB Details for Movies & TV Series
async function fetchMediaDetails(cleanTitle) {
    try {
        let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        let searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.[0]) {
            const movieId = searchRes.data.results[0].id;
            const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
            const detailRes = await axios.get(detailUrl);
            return { type: 'movie', data: detailRes.data };
        }

        searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.[0]) {
            const tvId = searchRes.data.results[0].id;
            const detailUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
            const detailRes = await axios.get(detailUrl);
            return { type: 'tv', data: detailRes.data };
        }
    } catch (e) {
        console.error("TMDB Fetch Error:", e.message);
    }
    return null;
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
// 2. GLOBAL REPLY LISTENER (MENU + MOVIES)
// ==========================================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, isCmd }) => {
    try {
        if (isCmd) return;
        const textMsg = body ? body.trim() : "";
        if (!textMsg || isNaN(textMsg)) return;

        const choiceIndex = parseInt(textMsg) - 1;

        // --- HANDLE THENKIRI MOVIE/TV REPLIES ---
        if (global.thenkiriSessions.has(from)) {
            const session = global.thenkiriSessions.get(from);

            if (Date.now() - session.timestamp > 300000) {
                global.thenkiriSessions.delete(from);
                return;
            }

            // STEP 1: MOVIE / TV SELECTION
            if (session.step === 'SELECTION') {
                const tkResults = session.results;
                if (choiceIndex < 0 || choiceIndex >= tkResults.length) return;

                const selectedMovie = tkResults[choiceIndex];
                const statusMsg = await conn.sendMessage(from, { text: `⏳ *Fetching Details & Poster...*` }, { quoted: mek });

                const options = await scraperThenkiri.getDownloadOptions(selectedMovie.link);

                if (!options || options.length === 0) {
                    await conn.sendMessage(from, { text: `❌ No download links found.` }, { quoted: mek });
                    global.thenkiriSessions.delete(from);
                    return;
                }

                let cleanTitle = selectedMovie.title
                    .split('|')[0]
                    .replace(/\(\d{4}\)/g, '')
                    .replace(/season\s*\d+/gi, '')
                    .replace(/s\d+/gi, '')
                    .replace(/download|movie|tv|show|sinhala|sub/gi, '')
                    .trim();

                const tmdbRes = await fetchMediaDetails(cleanTitle);
                const tmdbData = tmdbRes ? tmdbRes.data : null;
                const isTv = tmdbRes ? tmdbRes.type === 'tv' : false;

                const title = (isTv ? tmdbData?.name : tmdbData?.title) || cleanTitle;
                const releaseDate = (isTv ? tmdbData?.first_air_date : tmdbData?.release_date) || 'N/A';
                const year = releaseDate !== 'N/A' ? releaseDate.split('-')[0] : '';
                const rating = tmdbData?.vote_average ? `${tmdbData.vote_average.toFixed(1)} / 10` : 'N/A';
                const language = tmdbData?.original_language ? tmdbData.original_language.toUpperCase() : 'English';
                const genres = tmdbData?.genres ? tmdbData.genres.map(g => g.name).join(', ') : 'Action, Drama';

                const cast = tmdbData?.credits?.cast 
                    ? tmdbData.credits.cast.slice(0, 3).map(c => `• ${c.name} as ${c.character}`).join('\n') 
                    : '• N/A';

                const plot = tmdbData?.overview || 'No plot available.';
                const trailerObj = tmdbData?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
                const trailerLink = trailerObj ? `https://youtu.be/${trailerObj.key}` : 'N/A';

                const posterImg = tmdbData?.poster_path 
                    ? `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`
                    : (selectedMovie.img || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500");

                let captionText = `🎬 *${title}* ${year ? `(${year})` : ''}\n\n`;
                captionText += `⭐ *Rating:* ${rating}\n`;
                captionText += `📅 *Release Date:* ${releaseDate}\n`;
                captionText += `🌐 *Language:* ${language}\n\n`;
                captionText += `🎭 *Genres:* ${genres}\n\n`;
                captionText += `👥 *Cast:*\n${cast}\n\n`;
                captionText += `📖 *Plot:* ${plot}\n\n`;
                captionText += `🎬 *Trailer:* ${trailerLink}\n`;
                captionText += `----------------------------------------\n\n`;
                captionText += `📥 *Select Quality / Episode to Download:*\n\n`;

                options.forEach((opt, idx) => {
                    const qName = opt.quality || opt.name || 'Download File';
                    captionText += `*${idx + 1}.* ${qName}\n`;
                });

                captionText += `\n> ${FOOTER}`;

                await conn.sendMessage(from, { text: "✅ *Details Fetched!*", edit: statusMsg.key });

                await conn.sendMessage(from, {
                    image: { url: posterImg },
                    caption: captionText
                }, { quoted: mek });

                global.thenkiriSessions.set(from, {
                    step: 'DOWNLOAD',
                    options: options,
                    movieTitle: title,
                    timestamp: Date.now()
                });
                return;
            }

            // STEP 2: DOWNLOAD FILE / DIRECT LINK
            else if (session.step === 'DOWNLOAD') {
                const options = session.options;
                if (choiceIndex < 0 || choiceIndex >= options.length) return;

                const selectedOption = options[choiceIndex];
                const dlStatusMsg = await conn.sendMessage(from, { text: `⚡ *Downloading File...*` }, { quoted: mek });

                const finalDirectLink = await scraperThenkiri.bypassDownloadwella(selectedOption.link);

                if (!finalDirectLink) {
                    await conn.sendMessage(from, { text: `❌ Link bypass failed.`, edit: dlStatusMsg.key });
                    global.thenkiriSessions.delete(from);
                    return;
                }

                const qName = selectedOption.quality || selectedOption.name || 'Download File';
                const safeFileName = `${session.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;

                try {
                    await conn.sendMessage(from, {
                        document: { url: finalDirectLink },
                        mimetype: 'video/x-matroska',
                        fileName: safeFileName,
                        caption: `🍿 *${session.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n> ${FOOTER}`
                    }, { quoted: mek });

                    await conn.sendMessage(from, { text: "✅ *Upload Successful*", edit: dlStatusMsg.key });

                } catch (fileErr) {
                    await conn.sendMessage(from, {
                        text: `🍿 *${session.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n⚠️ *File size exceeds WhatsApp 2GB limit.*\n\n🔗 *Direct Download Link:*\n${finalDirectLink}\n\n> ${FOOTER}`
                    }, { quoted: mek });

                    await conn.sendMessage(from, { text: "✅ *Direct Link Sent*", edit: dlStatusMsg.key });
                }

                global.thenkiriSessions.delete(from);
                return;
            }
        }

        // --- HANDLE MAIN MENU REPLIES ---
        if (global.menuSessions.has(from)) {
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
        }

    } catch (err) {
        console.error("Reply Listener Error:", err);
    }
});

// ==========================================
// 3. MOVIE & TV SHOW COMMAND (THENKIRI)
// ==========================================
cmd({
    pattern: "thenkiri",
    alias: ["tk", "movie", "tenkiri", "tv"],
    desc: "Searches movies & TV series from Thenkiri",
    category: "movie",
    filename: __filename
}, async (socket, msg, m, { from, args }) => {
    if (!args || args.length === 0) {
        return socket.sendMessage(from, { text: "⚠️ Please enter a movie or TV show name!" }, { quoted: msg });
    }

    const searchQuery = args.join(' ');

    try {
        const results = await scraperThenkiri.searchMovie(searchQuery);

        if (!results || results.length === 0) {
            return socket.sendMessage(from, { text: `❌ No movies or TV series found for: *${searchQuery}*` }, { quoted: msg });
        }

        const tkResults = results.slice(0, 15);
        let listText = `🍿 *THENKIRI MOVIE & TV SEARCH* 🍿\n\n🔍 *Query:* ${searchQuery}\n\n🔽 *Reply with a number to select:*\n\n`;

        tkResults.forEach((item, index) => {
            const title = item.title || item.name || "Item";
            listText += `*${index + 1}.* ${title}\n`;
        });

        listText += `\n> ${FOOTER}`;

        await socket.sendMessage(from, { text: listText }, { quoted: msg });

        global.thenkiriSessions.set(from, {
            step: 'SELECTION',
            results: tkResults,
            timestamp: Date.now()
        });

    } catch (e) {
        await socket.sendMessage(from, { text: `❌ Thenkiri Search Error: ${e.message}` }, { quoted: msg });
    }
});

// ==========================================
// 4. SYSTEM & OTHER COMMANDS
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

