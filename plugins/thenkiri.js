const { cmd } = require('../command');
const scraperThenkiri = require('liyanaarachchi-thenkiri-scrap');
const axios = require('axios');

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const FOOTER = "© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳";

if (!global.thenkiriSessions) global.thenkiriSessions = new Map();
const activeProcessing = new Set();

function cleanTitleForTMDB(rawTitle) {
    return rawTitle
        .split('|')[0]
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/season\s*\d+/gi, '')
        .replace(/s\d+/gi, '')
        .replace(/episodes?\s*\d+/gi, '')
        .replace(/download|movie|tv|show|sinhala|sub|complete/gi, '')
        .replace(/[-_]/g, ' ')
        .trim();
}

async function fetchMediaDetails(rawTitle) {
    const cleanTitle = cleanTitleForTMDB(rawTitle);
    try {
        let searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        let searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.length > 0) {
            const tvId = searchRes.data.results[0].id;
            const detailUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
            const detailRes = await axios.get(detailUrl);
            return { type: 'tv', data: detailRes.data };
        }

        searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.length > 0) {
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

// Helper to Stream large files efficiently up to 2GB
async function sendLargeDocument(socket, from, url, fileName, caption, quotedMsg) {
    try {
        // Stream download directly to WhatsApp Uploader without disk storage
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            timeout: 0 // Infinite timeout for large files up to 2GB
        });

        await socket.sendMessage(from, {
            document: { stream: response.data },
            mimetype: 'video/x-matroska',
            fileName: fileName,
            caption: caption
        }, { quoted: quotedMsg });

        return true;
    } catch (error) {
        console.error("Stream Send Error, falling back to direct URL object:", error.message);
        
        // Fallback: Direct URL sending
        try {
            await socket.sendMessage(from, {
                document: { url: url },
                mimetype: 'video/x-matroska',
                fileName: fileName,
                caption: caption
            }, { quoted: quotedMsg });
            return true;
        } catch (err) {
            return false;
        }
    }
}

// THENKIRI COMMAND
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
            return socket.sendMessage(from, { text: `❌ No items found for: *${searchQuery}*` }, { quoted: msg });
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
        await socket.sendMessage(from, { text: `❌ Search Error: ${e.message}` }, { quoted: msg });
    }
});

// THENKIRI REPLY LISTENER
cmd({
    on: "body"
},
async (socket, msg, m, { from, body, isCmd }) => {
    try {
        if (isCmd) return;
        if (!global.thenkiriSessions.has(from)) return;
        if (activeProcessing.has(from)) return;

        const textMsg = body ? body.trim() : "";
        if (textMsg === "" || isNaN(textMsg)) return;

        const session = global.thenkiriSessions.get(from);
        if (Date.now() - session.timestamp > 300000) {
            global.thenkiriSessions.delete(from);
            return;
        }

        const selectedNum = parseInt(textMsg);

        // STEP 1: MOVIE / TV SHOW SELECTION
        if (session.step === 'SELECTION') {
            const choiceIndex = selectedNum - 1;
            const tkResults = session.results;

            if (choiceIndex < 0 || choiceIndex >= tkResults.length) return;

            activeProcessing.add(from);

            const selectedMovie = tkResults[choiceIndex];
            const statusMsg = await socket.sendMessage(from, { text: `⏳ *Fetching Details & Poster...*` }, { quoted: msg });

            const options = await scraperThenkiri.getDownloadOptions(selectedMovie.link);

            if (!options || options.length === 0) {
                await socket.sendMessage(from, { text: `❌ No download links found.` }, { quoted: msg });
                global.thenkiriSessions.delete(from);
                activeProcessing.delete(from);
                return;
            }

            const rawTitle = selectedMovie.title || selectedMovie.name || "Movie";
            const tmdbRes = await fetchMediaDetails(rawTitle);
            const tmdbData = tmdbRes ? tmdbRes.data : null;
            const isTv = tmdbRes ? tmdbRes.type === 'tv' : false;

            const title = (isTv ? tmdbData?.name : tmdbData?.title) || rawTitle;
            const releaseDate = (isTv ? tmdbData?.first_air_date : tmdbData?.release_date) || 'N/A';
            const year = releaseDate !== 'N/A' ? releaseDate.split('-')[0] : '';
            const rating = tmdbData?.vote_average ? `${tmdbData.vote_average.toFixed(1)} / 10` : 'N/A';
            const language = tmdbData?.original_language ? tmdbData.original_language.toUpperCase() : 'English';
            const genres = tmdbData?.genres ? tmdbData.genres.map(g => g.name).join(', ') : 'Drama, Action';

            const cast = (tmdbData && tmdbData.credits && tmdbData.credits.cast)
                ? tmdbData.credits.cast.slice(0, 3).map(c => `• ${c.name} as ${c.character}`).join('\n')
                : '• N/A';

            const plot = tmdbData?.overview || 'No plot available.';
            const trailerObj = (tmdbData && tmdbData.videos && tmdbData.videos.results)
                ? tmdbData.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
                : null;
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
            captionText += `*0.* 📦 *ALL EPISODES / QUALITIES (AUTO DOWNLOAD ALL)*\n\n`;

            options.forEach((opt, idx) => {
                const qName = opt.quality || opt.name || `Episode ${idx + 1}`;
                captionText += `*${idx + 1}.* ${qName}\n`;
            });

            captionText += `\n> ${FOOTER}`;

            await socket.sendMessage(from, { text: "✅ *Details Fetched!*", edit: statusMsg.key });

            await socket.sendMessage(from, {
                image: { url: posterImg },
                caption: captionText
            }, { quoted: msg });

            global.thenkiriSessions.set(from, {
                step: 'DOWNLOAD',
                options: options,
                movieTitle: title,
                timestamp: Date.now()
            });

            activeProcessing.delete(from);
        } 

        // STEP 2: DOWNLOAD HANDLING
        else if (session.step === 'DOWNLOAD') {
            const options = session.options;

            global.thenkiriSessions.delete(from);
            activeProcessing.add(from);

            // OPTION 0: AUTO DOWNLOAD ALL EPISODES
            if (selectedNum === 0) {
                await socket.sendMessage(from, { text: `📦 *Downloading ALL (${options.length}) Episodes/Files... Please wait!*` }, { quoted: msg });

                for (let i = 0; i < options.length; i++) {
                    const opt = options[i];
                    const qName = opt.quality || opt.name || `Episode ${i + 1}`;
                    const directLink = await scraperThenkiri.bypassDownloadwella(opt.link);

                    if (directLink) {
                        const safeFileName = `${session.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;
                        const caption = `🍿 *${session.movieTitle}*\n📌 *Item (${i + 1}/${options.length}):* ${qName}\n\n> ${FOOTER}`;

                        const success = await sendLargeDocument(socket, from, directLink, safeFileName, caption, msg);

                        if (!success) {
                            await socket.sendMessage(from, {
                                text: `🍿 *${session.movieTitle}*\n📌 *Item (${i + 1}/${options.length}):* ${qName}\n\n⚠️ *File size exceeds 2GB or URL Restricted.*\n\n🔗 *Direct Download Link:*\n${directLink}`
                            }, { quoted: msg });
                        }
                    }
                }
                await socket.sendMessage(from, { text: `✅ *ALL (${options.length}) Files Processed!*` }, { quoted: msg });
            } 
            // INDIVIDUAL EPISODE SELECTION
            else {
                const choiceIndex = selectedNum - 1;
                if (choiceIndex >= 0 && choiceIndex < options.length) {
                    const selectedOption = options[choiceIndex];
                    const dlStatusMsg = await socket.sendMessage(from, { text: `⚡ *Downloading & Uploading File...*` }, { quoted: msg });

                    const finalDirectLink = await scraperThenkiri.bypassDownloadwella(selectedOption.link);

                    if (!finalDirectLink) {
                        await socket.sendMessage(from, { text: `❌ Link bypass failed.`, edit: dlStatusMsg.key });
                    } else {
                        const qName = selectedOption.quality || selectedOption.name || 'Download File';
                        const safeFileName = `${session.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;
                        const caption = `🍿 *${session.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n> ${FOOTER}`;

                        const success = await sendLargeDocument(socket, from, finalDirectLink, safeFileName, caption, msg);

                        if (success) {
                            await socket.sendMessage(from, { text: "✅ *Upload Successful*", edit: dlStatusMsg.key });
                        } else {
                            await socket.sendMessage(from, {
                                text: `🍿 *${session.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n⚠️ *File size exceeds 2GB limit or direct connection blocked.*\n\n🔗 *Direct Download Link:*\n${finalDirectLink}\n\n> ${FOOTER}`
                            }, { quoted: msg });

                            await socket.sendMessage(from, { text: "✅ *Direct Link Sent*", edit: dlStatusMsg.key });
                        }
                    }
                }
            }
            activeProcessing.delete(from);
        }

    } catch (err) {
        activeProcessing.delete(from);
        console.error("Thenkiri Reply Listener Error:", err);
    }
});
