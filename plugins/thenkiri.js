const { cmd } = require('../command');
const scraper = require('liyanaarachchi-thenkiri-scrap');
const axios = require('axios');

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const FOOTER = "ᴀᴠɪꜱʜᴋᴀ ヤ";

// Active Chat Tracker (JID මත පදනම්ව)
const thenkiriSessions = new Map();

// 1️⃣ MAIN COMMAND: Search & Display Movies
cmd({
    pattern: "tenkiri",
    alias: ["tk", "thenkiri"],
    desc: "Search and download movies from Thenkiri",
    category: "download",
    react: "🍿",
},
async (socket, msg, m, { from, args }) => {
    const chatJid = from;

    if (!args.length) {
        await socket.sendMessage(chatJid, {
            text: `🍿 *THENKIRI MOVIE DOWNLOADER* 🍿\n\n⚠️ *Please provide a movie name!*\n\nExample: .tenkiri deadpool\n\n> ${FOOTER}`
        }, { quoted: msg });
        return;
    }

    const searchQuery = args.join(' ');

    try {
        const searchResults = await scraper.searchMovie(searchQuery);

        if (!searchResults || searchResults.length === 0) {
            await socket.sendMessage(chatJid, {
                text: `🍿 *THENKIRI MOVIE DOWNLOADER* 🍿\n\n🔍 *Search Query:* ${searchQuery}\n\n❌ No movies found!\n\n> ${FOOTER}`
            }, { quoted: msg });
            return;
        }

        const tkResults = searchResults.slice(0, 15);
        let listText = `🍿 *THENKIRI MOVIE DOWNLOADER* 🍿\n\n🔍 *Search Query:* ${searchQuery}\n\n🔽 *Reply with a number to select a movie:*\n\n`;

        tkResults.forEach((item, index) => {
            const title = item.title || item.name || "Movie";
            listText += `*${index + 1}.* ${title}\n`;
        });

        listText += `\n> ${FOOTER}`;

        await socket.sendMessage(chatJid, { text: listText }, { quoted: msg });

        // Save active session for the chat
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

// 2️⃣ AUTO REPLY LISTENER: Same File Single Handler
cmd({
    on: "body"
},
async (socket, msg, m, { from, body, isCmd }) => {
    try {
        // Command එකක් නම් Reply Listener එක Ignore කරන්න
        if (isCmd) return;

        const chatJid = from;
        const session = thenkiriSessions.get(chatJid);

        if (!session) return;

        // Session timeout check (5 Minutes)
        if (Date.now() - session.timestamp > 300000) {
            thenkiriSessions.delete(chatJid);
            return;
        }

        // Quoted message එකක් නැත්නම් Ignore කරන්න
        if (!m.quoted) return;

        const textMsg = body ? body.trim() : "";
        if (!textMsg || isNaN(textMsg)) return;

        // ----------------------------------------------------
        // STEP 1: MOVIE SELECTION
        // ----------------------------------------------------
        if (session.step === 'SELECTION') {
            const choice = parseInt(textMsg) - 1;
            const tkResults = session.results;

            if (choice < 0 || choice >= tkResults.length) return;

            const selectedMovie = tkResults[choice];
            const statusMsg = await socket.sendMessage(chatJid, { text: `⏳ *Fetching Details...*` }, { quoted: msg });

            const options = await scraper.getDownloadOptions(selectedMovie.link);

            if (!options || options.length === 0) {
                await socket.sendMessage(chatJid, { text: `❌ No download links found for this movie.` }, { quoted: msg });
                thenkiriSessions.delete(chatJid);
                return;
            }

            let tmdbData = null;
            let cleanTitle = selectedMovie.title
                .split('|')[0]
                .replace(/\(\d{4}\)/g, '')
                .replace(/download|movie|sinhala|sub/gi, '')
                .trim();

            try {
                const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
                const searchRes = await axios.get(searchUrl);

                if (searchRes.data?.results?.[0]) {
                    const movieId = searchRes.data.results[0].id;
                    const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
                    const detailRes = await axios.get(detailUrl);
                    tmdbData = detailRes.data;
                }
            } catch (e) {
                console.error("TMDB Fetch Error:", e.message);
            }

            const title = tmdbData?.title || cleanTitle;
            const year = tmdbData?.release_date ? tmdbData.release_date.split('-')[0] : '';
            const rating = tmdbData?.vote_average ? `${tmdbData.vote_average.toFixed(1)} / 10` : 'N/A';
            const runtime = tmdbData?.runtime ? `${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}m` : 'N/A';
            const releaseDate = tmdbData?.release_date || 'N/A';
            const language = tmdbData?.original_language ? tmdbData.original_language.toUpperCase() : 'English';
            const genres = tmdbData?.genres ? tmdbData.genres.map(g => g.name).join(', ') : 'Action, Adventure';
            
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
            captionText += `⌛ *Runtime:* ${runtime}\n`;
            captionText += `📅 *Release Date:* ${releaseDate}\n`;
            captionText += `🌐 *Language:* ${language}\n\n`;
            captionText += `🎭 *Genres:* ${genres}\n\n`;
            captionText += `👥 *Cast:*\n${cast}\n\n`;
            captionText += `📖 *Plot:* ${plot}\n\n`;
            captionText += `🎬 *Trailer:* ${trailerLink}\n`;
            captionText += `----------------------------------------\n\n`;
            captionText += `📥 *Select Download Quality:*\n\n`;

            options.forEach((opt, i) => {
                const qName = opt.quality || opt.name || 'Download Movie';
                captionText += `*${i + 1}.* ${qName}\n`;
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
        // STEP 2: QUALITY / DOWNLOAD SELECTION
        // ----------------------------------------------------
        else if (session.step === 'DOWNLOAD') {
            const choiceNum = parseInt(textMsg) - 1;
            const options = session.options;

            if (choiceNum < 0 || choiceNum >= options.length) return;

            const selectedOption = options[choiceNum];
            const dlStatusMsg = await socket.sendMessage(chatJid, { text: `⚡ *Downloading Movie File...*` }, { quoted: msg });

            const finalDirectLink = await scraper.bypassDownloadwella(selectedOption.link);

            if (!finalDirectLink) {
                await socket.sendMessage(chatJid, {
                    text: `❌ Link bypass failed.`,
                    edit: dlStatusMsg.key
                });
                thenkiriSessions.delete(chatJid);
                return;
            }

            const qName = selectedOption.quality || selectedOption.name || 'Download Movie';
            const safeFileName = `${session.movieTitle.replace(/[/\\?%*:|"<>]/g, "")}_${qName.replace(/\s+/g, '_')}.mkv`;

            try {
                // Try Sending Direct Document File
                await socket.sendMessage(chatJid, {
                    document: { url: finalDirectLink },
                    mimetype: 'video/x-matroska',
                    fileName: safeFileName,
                    caption: `🍿 *${session.movieTitle}*\n📌 *Quality:* ${qName}\n\n> ${FOOTER}`
                }, { quoted: msg });

                await socket.sendMessage(chatJid, {
                    text: "✅ *Movie Upload Successful* ✅",
                    edit: dlStatusMsg.key
                });

            } catch (fileErr) {
                console.error("File upload error (2GB+ Limit):", fileErr.message);

                // Fallback for large files
                await socket.sendMessage(chatJid, {
                    text: `🍿 *${session.movieTitle}*\n📌 *Quality:* ${qName}\n\n⚠️ *File size exceeds WhatsApp limit (2GB+).*\n\n🔗 *Direct Download Link:*\n${finalDirectLink}\n\n> ${FOOTER}`
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
