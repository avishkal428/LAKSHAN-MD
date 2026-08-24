const { cmd } = require('../command');
const { sleep } = require('../lib/functions');
const scraperThenkiri = require('liyanaarachchi-thenkiri-scrap');
const axios = require('axios');

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const FOOTER = "© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳";

if (!global.userState) global.userState = new Map();

function cleanSearchTitle(rawTitle) {
    return rawTitle
        .split('|')[0]
        .replace(/\(Episode.*?\)/gi, '')
        .replace(/\(Season.*?\)/gi, '')
        .replace(/\(\d{4}\)/g, '')
        .replace(/season\s*\d+/gi, '')
        .replace(/s\d+/gi, '')
        .replace(/download|movie|tv|show|sinhala|sub|added/gi, '')
        .replace(/[-–—]/g, ' ')
        .trim();
}

async function fetchMediaDetails(cleanTitle) {
    try {
        let searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        let searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.[0]) {
            const tvId = searchRes.data.results[0].id;
            const detailUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
            const detailRes = await axios.get(detailUrl);
            return { type: 'tv', data: detailRes.data };
        }

        searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.[0]) {
            const movieId = searchRes.data.results[0].id;
            const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
            const detailRes = await axios.get(detailUrl);
            return { type: 'movie', data: detailRes.data };
        }
    } catch (e) {
        console.error("TMDB Fetch Error:", e.message);
    }
    return null;
}

// ==========================================
// 1. SEARCH COMMAND
// ==========================================
cmd({
    pattern: "thenkiri",
    alias: ["tk", "tv", "movie"],
    desc: "Search & Download Movies/TV Shows",
    category: "movie",
    filename: __filename
}, async (conn, mek, m, { from, args, sender }) => {
    if (!args || args.length === 0) {
        return conn.sendMessage(from, { text: "⚠️ Please enter a movie or TV show name!\n*Example:* `.tv game of thrones`" }, { quoted: mek });
    }

    const searchQuery = args.join(' ');
    const userId = sender || from;

    try {
        const results = await scraperThenkiri.searchMovie(searchQuery);

        if (!results || results.length === 0) {
            return conn.sendMessage(from, { text: `❌ No results found for: *${searchQuery}*` }, { quoted: mek });
        }

        const tkResults = results.slice(0, 15);
        let listText = `🍿 *THENKIRI MOVIE & TV SEARCH* 🍿\n\n🔍 *Query:* ${searchQuery}\n\n🔽 *Reply with the number to select:*\n\n`;

        tkResults.forEach((item, index) => {
            const title = item.title || item.name || "Item";
            listText += `*${index + 1}.* ${title}\n`;
        });

        listText += `\n> ${FOOTER}`;

        await conn.sendMessage(from, { text: listText }, { quoted: mek });

        global.userState.set(userId, {
            step: 'MOVIE_LIST',
            results: tkResults,
            timestamp: Date.now()
        });

    } catch (e) {
        await conn.sendMessage(from, { text: `❌ Search Error: ${e.message}` }, { quoted: mek });
    }
});

// ==========================================
// 2. STATE-BASED REPLY LISTENER
// ==========================================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isCmd, sender }) => {
    try {
        if (isCmd) return;

        const textMsg = body ? body.trim() : "";
        if (textMsg === "" || isNaN(textMsg)) return;

        const userId = sender || from;
        if (!global.userState.has(userId)) return;

        const state = global.userState.get(userId);

        // Timeout 15 mins
        if (Date.now() - state.timestamp > 900000) {
            global.userState.delete(userId);
            return;
        }

        const choiceNum = parseInt(textMsg);
        const choiceIndex = choiceNum - 1;

        // --- STEP 1: USER CHOOSES MOVIE FROM LIST ---
        if (state.step === 'MOVIE_LIST') {
            const tkResults = state.results;

            if (choiceIndex >= 0 && choiceIndex < tkResults.length) {
                const selectedMovie = tkResults[choiceIndex];
                const statusMsg = await conn.sendMessage(from, { text: `⏳ *Fetching Details...*` }, { quoted: mek });

                const options = await scraperThenkiri.getDownloadOptions(selectedMovie.link);

                if (!options || options.length === 0) {
                    await conn.sendMessage(from, { text: `❌ No download links found.` }, { quoted: mek });
                    return;
                }

                let cleanTitle = cleanSearchTitle(selectedMovie.title);
                const tmdbRes = await fetchMediaDetails(cleanTitle);
                const tmdbData = tmdbRes ? tmdbRes.data : null;
                const isTv = tmdbRes ? tmdbRes.type === 'tv' : false;

                const title = (isTv ? tmdbData?.name : tmdbData?.title) || selectedMovie.title;
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

                let posterImg = 'https://files.catbox.moe/uqofdi.jpg';
                if (tmdbData?.poster_path) {
                    posterImg = `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`;
                } else if (selectedMovie.img) {
                    posterImg = selectedMovie.img;
                }

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
                captionText += `*0.* 📦 *ALL EPISODES / QUALITIES (DOWNLOAD ALL)*\n\n`;

                options.forEach((opt, idx) => {
                    const qName = opt.quality || opt.name || `Episode ${idx + 1}`;
                    captionText += `*${idx + 1}.* ${qName}\n`;
                });

                captionText += `\n> ${FOOTER}`;

                await conn.sendMessage(from, { text: "✅ *Details Fetched!*", edit: statusMsg.key });

                try {
                    await conn.sendMessage(from, {
                        image: { url: posterImg },
                        caption: captionText
                    }, { quoted: mek });
                } catch (e) {
                    await conn.sendMessage(from, {
                        text: captionText
                    }, { quoted: mek });
                }

                global.userState.set(userId, {
                    step: 'QUALITY_LIST',
                    options: options,
                    movieTitle: title,
                    previousResults: tkResults,
                    timestamp: Date.now()
                });
            }
            return;
        }

        // --- STEP 2: USER CHOOSES QUALITY/EPISODE TO DOWNLOAD ---
        if (state.step === 'QUALITY_LIST') {
            const options = state.options;

            // Option 0: Download All
            if (choiceNum === 0) {
                global.userState.set(userId, {
                    step: 'MOVIE_LIST',
                    results: state.previousResults,
                    timestamp: Date.now()
                });

                await conn.sendMessage(from, { text: `📦 *Downloading ALL (${options.length}) items...*` }, { quoted: mek });

                for (let i = 0; i < options.length; i++) {
                    const opt = options[i];
                    const qName = opt.quality || opt.name || `Episode ${i + 1}`;
                    
                    let finalDirectLink = null;
                    try {
                        finalDirectLink = await scraperThenkiri.bypassDownloadwella(opt.link);
                    } catch (e) {
                        finalDirectLink = opt.link;
                    }

                    if (!finalDirectLink) finalDirectLink = opt.link;

                    const safeFileName = `${state.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;

                    try {
                        await conn.sendMessage(from, {
                            document: { url: finalDirectLink },
                            mimetype: 'video/x-matroska',
                            fileName: safeFileName,
                            caption: `🍿 *${state.movieTitle}*\n📌 *Item:* ${qName}\n\n> ${FOOTER}`
                        }, { quoted: mek });
                    } catch (e) {
                        await conn.sendMessage(from, {
                            text: `🍿 *${state.movieTitle}*\n📌 *Item:* ${qName}\n🔗 *Direct Link:*\n${finalDirectLink}`
                        }, { quoted: mek });
                    }

                    if (sleep) await sleep(3000);
                }
                return;
            }

            // Single Quality/Episode Selection
            if (choiceIndex >= 0 && choiceIndex < options.length) {
                const selectedOption = options[choiceIndex];
                const dlStatus = await conn.sendMessage(from, { text: `⚡ *Downloading File...*` }, { quoted: mek });

                let finalDirectLink = null;
                try {
                    finalDirectLink = await scraperThenkiri.bypassDownloadwella(selectedOption.link);
                } catch (e) {
                    finalDirectLink = selectedOption.link;
                }

                if (!finalDirectLink) finalDirectLink = selectedOption.link;

                const qName = selectedOption.quality || selectedOption.name || 'File';
                const safeFileName = `${state.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;

                try {
                    await conn.sendMessage(from, {
                        document: { url: finalDirectLink },
                        mimetype: 'video/x-matroska',
                        fileName: safeFileName,
                        caption: `🍿 *${state.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n> ${FOOTER}`
                    }, { quoted: mek });

                    await conn.sendMessage(from, { text: "✅ *Upload Complete*", edit: dlStatus.key });

                } catch (fileErr) {
                    await conn.sendMessage(from, {
                        text: `🍿 *${state.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n🔗 *Direct Download Link:*\n${finalDirectLink}\n\n> ${FOOTER}`
                    }, { quoted: mek });

                    await conn.sendMessage(from, { text: "✅ *Link Sent*", edit: dlStatus.key });
                }

                global.userState.set(userId, {
                    step: 'MOVIE_LIST',
                    results: state.previousResults,
                    timestamp: Date.now()
                });
            }
        }

    } catch (err) {
        console.error("Thenkiri Logic Error:", err);
    }
});
