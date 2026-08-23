const { cmd } = require('../command');
const scraper = require('liyanaarachchi-thenkiri-scrap');
const axios = require('axios');

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const FOOTER = "ᴀᴠɪꜱʜᴋᴀ ヤ";

const thenkiriSessions = new Map();

// Helper Function: Movie/TV Details via TMDB
async function fetchMediaDetails(cleanTitle) {
    try {
        // First Try: Search Movie
        let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        let searchRes = await axios.get(searchUrl);

        if (searchRes.data?.results?.[0]) {
            const movieId = searchRes.data.results[0].id;
            const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
            const detailRes = await axios.get(detailUrl);
            return { type: 'movie', data: detailRes.data };
        }

        // Second Try: Search TV Series
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

// 1️⃣ SEARCH COMMAND
cmd({
    pattern: "tenkiri",
    alias: ["tk", "thenkiri"],
    desc: "Search and download movies & TV series from Thenkiri",
    category: "download",
    react: "🍿",
},
async (socket, msg, m, { from, args }) => {
    const chatJid = from;

    if (!args.length) {
        await socket.sendMessage(chatJid, {
            text: `🍿 *THENKIRI DOWNLOADER* 🍿\n\n⚠️ *Please provide a movie or TV show name!*\n\nExample: .tenkiri loki\n\n> ${FOOTER}`
        }, { quoted: msg });
        return;
    }

    const searchQuery = args.join(' ');

    try {
        const searchResults = await scraper.searchMovie(searchQuery);

        if (!searchResults || searchResults.length === 0) {
            await socket.sendMessage(chatJid, {
                text: `🍿 *THENKIRI DOWNLOADER* 🍿\n\n🔍 *Search Query:* ${searchQuery}\n\n❌ No items found!\n\n> ${FOOTER}`
            }, { quoted: msg });
            return;
        }

        const tkResults = searchResults.slice(0, 15);
        let listText = `🍿 *THENKIRI DOWNLOADER* 🍿\n\n🔍 *Search Query:* ${searchQuery}\n\n🔽 *Reply with a number to select:*\n\n`;

        tkResults.forEach((item, index) => {
            const title = item.title || item.name || "Item";
            listText += `*${index + 1}.* ${title}\n`;
        });

        listText += `\n> ${FOOTER}`;

        await socket.sendMessage(chatJid, { text: listText }, { quoted: msg });

        thenkiriSessions.set(chatJid, {
            step: 'SELECTION',
            results: tkResults,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Thenkiri Search Error:', error);
        await socket.sendMessage(chatJid, {
            text: `❌ *Error:* ${error.message || 'Something went wrong!'}\n\n> ${FOOTER}`
        }, { quoted: msg });
    }
});

// 2️⃣ AUTO REPLY LISTENER
cmd({
    on: "body"
},
async (socket, msg, m, { from, body, isCmd }) => {
    try {
        if (isCmd) return;

        const chatJid = from;
        const session = thenkiriSessions.get(chatJid);

        if (!session) return;
        if (Date.now() - session.timestamp > 300000) {
            thenkiriSessions.delete(chatJid);
            return;
        }

        if (!m.quoted) return;

        const textMsg = body ? body.trim() : "";
        if (!textMsg || isNaN(textMsg)) return;

        const choiceIndex = parseInt(textMsg) - 1;

        // ----------------------------------------------------
        // STEP 1: ITEM SELECTION & DETAILS
        // ----------------------------------------------------
        if (session.step === 'SELECTION') {
            const tkResults = session.results;

            if (choiceIndex < 0 || choiceIndex >= tkResults.length) return;

            const selectedMovie = tkResults[choiceIndex];
            const statusMsg = await socket.sendMessage(chatJid, { text: `⏳ *Fetching Details...*` }, { quoted: msg });

            const options = await scraper.getDownloadOptions(selectedMovie.link);

            if (!options || options.length === 0) {
                await socket.sendMessage(chatJid, { text: `❌ No download links found.` }, { quoted: msg });
                thenkiriSessions.delete(chatJid);
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
            captionText += `📥 *Select Download Quality / Episode:*\n\n`;

            options.forEach((opt, idx) => {
                const qName = opt.quality || opt.name || 'Download File';
                captionText += `*${idx + 1}.* ${qName}\n`;
            });

            captionText += `\n> ${FOOTER}`;

            await socket.sendMessage(chatJid, {
                text: "✅ *Details Fetched Successfully* ✅",
                edit: statusMsg.key
            });

            await socket.sendMessage(chatJid, {
                image: { url: posterImg },
                caption: captionText
            }, { quoted: msg });

            thenkiriSessions.set(chatJid, {
                step: 'DOWNLOAD',
                options: options,
                movieTitle: title,
                timestamp: Date.now()
            });
        }

        // ----------------------------------------------------
        // STEP 2: QUALITY / EPISODE SELECTION & SEND FILE
        // ----------------------------------------------------
        else if (session.step === 'DOWNLOAD') {
            const options = session.options;

            if (choiceIndex < 0 || choiceIndex >= options.length) return;

            const selectedOption = options[choiceIndex];
            const dlStatusMsg = await socket.sendMessage(chatJid, { text: `⚡ *Downloading File...*` }, { quoted: msg });

            const finalDirectLink = await scraper.bypassDownloadwella(selectedOption.link);

            if (!finalDirectLink) {
                await socket.sendMessage(chatJid, {
                    text: `❌ Direct download link generation failed.`,
                    edit: dlStatusMsg.key
                });
                thenkiriSessions.delete(chatJid);
                return;
            }

            const qName = selectedOption.quality || selectedOption.name || 'Download File';
            const safeFileName = `${session.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;

            try {
                await socket.sendMessage(chatJid, {
                    document: { url: finalDirectLink },
                    mimetype: 'video/x-matroska',
                    fileName: safeFileName,
                    caption: `🍿 *${session.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n> ${FOOTER}`
                }, { quoted: msg });

                await socket.sendMessage(chatJid, {
                    text: "✅ *Upload Successful* ✅",
                    edit: dlStatusMsg.key
                });

            } catch (fileErr) {
                console.error("Upload Limit Exceeded (2GB+):", fileErr.message);

                await socket.sendMessage(chatJid, {
                    text: `🍿 *${session.movieTitle}*\n📌 *Quality/Episode:* ${qName}\n\n⚠️ *File size exceeds WhatsApp limit (2GB+).*\n\n🔗 *Direct Download Link:*\n${finalDirectLink}\n\n> ${FOOTER}`
                }, { quoted: msg });

                await socket.sendMessage(chatJid, {
                    text: "✅ *Direct Link Sent Successfully* ✅",
                    edit: dlStatusMsg.key
                });
            }

            thenkiriSessions.delete(chatJid);
        }

    } catch (err) {
        console.error("Thenkiri Reply Listener Error:", err);
    }
});
