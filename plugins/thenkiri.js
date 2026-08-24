const { cmd } = require('../command');
const scraperThenkiri = require('liyanaarachchi-thenkiri-scrap');
const axios = require('axios');

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const DEFAULT_FOOTER = "\n\n© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙻𝙰𝙺𝚂𝙷𝙰𝙽-𝙼𝙳";

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
// THENKIRI COMMAND & LISTENERS
// ==========================================
cmd({
    pattern: "thenkiri",
    alias: ["tk", "tv", "movie"],
    desc: "Search and download movies/tv shows from Thenkiri",
    category: "download",
    react: "🍿"
},
async (socket, msg, m, { from, args }) => {
    const sender = from;

    if (!args.length) {
        await socket.sendMessage(sender, {
            text: `*❪ ERROR ❫*\n\n⚠️ *Invalid Usage!*\n\n🍿 *Example:*\n• .thenkiri Game of Thrones\n• .tv Avatar\n\n📝 _Please provide the Movie/Show name!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
        return;
    }

    const searchQuery = args.join(' ');
    await socket.sendMessage(sender, { 
        text: `*( SEARCHING )*\n\n🎥 *Searching on Thenkiri...*`
    });

    try {
        // 1. SEARCH THENKIRI
        const results = await scraperThenkiri.searchMovie(searchQuery);

        if (!results || results.length === 0) {
            await socket.sendMessage(sender, {
                text: `*❪ NO RESULTS ❫*\n\n😞 *No Results Found!*\n\n🍿 *Query:* _${searchQuery}_${DEFAULT_FOOTER}`
            }, { quoted: msg });
            return;
        }

        const movieResults = results.slice(0, 15);
        
        let listText = `🍿 *THENKIRI SEARCH* 🍿\n\n*Entered Name ||* ${searchQuery}\n\n*🔢 Reply below number*\n\n*[Results from Thenkiri]*\n\n`;

        movieResults.forEach((item, index) => {
            const title = item.title || item.name || "Movie";
            listText += `*🔶 ${index + 1} ❯❯◦* ${title}\n`;
        });

        listText += `${DEFAULT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, { text: listText }, { quoted: msg });
        const messageID = sentMsg.key.id;

        // 2. SELECTION LISTENER
        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToSentMsg && sender === replyMek.key.remoteJid) {
                const choice = parseInt(messageType) - 1;
                if (isNaN(choice) || choice < 0 || choice >= movieResults.length) {
                    await socket.sendMessage(sender, {
                        text: `*⚠️ Wrong Number! Range: 1 - ${movieResults.length}*${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    return;
                }

                const selectedMovie = movieResults[choice];
                
                await socket.sendMessage(sender, { 
                    text: `*( FETCHING )*\n\n🎬 *Fetching Details...*`
                }, { quoted: replyMek });

                try {
                    // Fetch options using scraper
                    const options = await scraperThenkiri.getDownloadOptions(selectedMovie.link);

                    if (!options || options.length === 0) {
                        await socket.sendMessage(sender, {
                            text: `*⚠️ No Download Links Found!*${DEFAULT_FOOTER}`
                        }, { quoted: replyMek });
                        return;
                    }

                    // TMDB Data Fetching
                    let cleanedTitle = cleanSearchTitle(selectedMovie.title);
                    const tmdbRes = await fetchMediaDetails(cleanedTitle);
                    const tmdbData = tmdbRes ? tmdbRes.data : null;
                    const isTv = tmdbRes ? tmdbRes.type === 'tv' : false;

                    const titleText = (isTv ? tmdbData?.name : tmdbData?.title) || selectedMovie.title;
                    const releaseDate = (isTv ? tmdbData?.first_air_date : tmdbData?.release_date) || 'N/A';
                    const rating = tmdbData?.vote_average ? `${tmdbData.vote_average.toFixed(1)} / 10` : 'N/A';
                    const language = tmdbData?.original_language ? tmdbData.original_language.toUpperCase() : 'English';
                    const genres = tmdbData?.genres ? tmdbData.genres.map(g => g.name).join(', ') : 'N/A';
                    const overview = tmdbData?.overview || 'No overview available.';

                    let posterUrl = 'https://files.catbox.moe/uqofdi.jpg';
                    if (tmdbData?.poster_path) {
                        posterUrl = `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`;
                    } else if (selectedMovie.img) {
                        posterUrl = selectedMovie.img;
                    }

                    // Details Caption
                    const movieDetailsText = `🎬 *Tɪᴛʟᴇ:* *_${titleText}_*

*▫️⭐ 𝗥ᴀᴛɪɴɢ:* *_${rating}_*
*▫️📅 𝗥ᴇʟᴇᴀꜱᴇ 𝗗ᴀᴛᴇ:* *_${releaseDate}_*
*▫️🌐 𝗟ᴀɴɢᴜᴀɢᴇ:* *_${language}_*
*▫️🎭 𝗚ᴇɴʀᴇꜱ:* *_${genres}_*

*📖 𝗣ʟᴏᴛ:*
_${overview.slice(0, 300)}..._
${DEFAULT_FOOTER}`;

                    await socket.sendMessage(sender, {
                        image: { url: posterUrl },
                        caption: movieDetailsText
                    }, { quoted: replyMek });

                    // Download Options Text
                    let downloadOptionsText = `*Download Options..*\n\n*🔢 Reply below number*\n\n*[Available Qualities/Episodes]*\n\n`;

                    downloadOptionsText += options.map((opt, i) => {
                        const qName = opt.quality || opt.name || `Episode ${i + 1}`;
                        return `*🔸 ${i + 1}* ❯❯◦ \`${qName}\``;
                    }).join('\n');

                    downloadOptionsText += `${DEFAULT_FOOTER}`;

                    const downloadOptionsMsg = await socket.sendMessage(sender, { text: downloadOptionsText }, { quoted: replyMek });
                    const optionsMsgID = downloadOptionsMsg.key.id;

                    // 3. DOWNLOAD LISTENER
                    const handleDownload = async ({ messages: downloadMessages }) => {
                        const downloadMek = downloadMessages[0];
                        if (!downloadMek?.message) return;

                        const downloadChoice = downloadMek.message.conversation || downloadMek.message.extendedTextMessage?.text;
                        const isReplyToOptionsMsg = downloadMek.message.extendedTextMessage?.contextInfo?.stanzaId === optionsMsgID;

                        if (isReplyToOptionsMsg && sender === downloadMek.key.remoteJid) {
                            const choiceNum = parseInt(downloadChoice) - 1;
                            
                            if (isNaN(choiceNum) || choiceNum < 0 || choiceNum >= options.length) {
                                await socket.sendMessage(sender, {
                                    text: `*⚠️ Wrong Number! Range: 1 - ${options.length}*${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                                return;
                            }

                            const selectedOption = options[choiceNum];
                            await socket.sendMessage(sender, { react: { text: '📥', key: downloadMek.key } });

                            try {
                                let finalDirectLink = null;
                                try {
                                    finalDirectLink = await scraperThenkiri.bypassDownloadwella(selectedOption.link);
                                } catch (e) {
                                    finalDirectLink = selectedOption.link;
                                }

                                if (!finalDirectLink) finalDirectLink = selectedOption.link;

                                if (finalDirectLink && finalDirectLink.includes('pixeldrain.com/u/')) {
                                    finalDirectLink = finalDirectLink.replace('/u/', '/api/file/') + '?download';
                                }

                                const qName = selectedOption.quality || selectedOption.name || 'File';
                                const cleanFileName = `${titleText.replace(/[^a-zA-Z0-9]/g, '_')}_${qName.replace(/\s+/g, '_')}.mkv`;

                                const fileCaption = `*🍿 ${titleText}*\n📌 _${qName}_${DEFAULT_FOOTER}`;

                                await socket.sendMessage(sender, {
                                    document: { url: finalDirectLink },
                                    mimetype: 'video/x-matroska',
                                    fileName: cleanFileName,
                                    caption: fileCaption
                                }, { quoted: downloadMek });

                                await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });

                            } catch (downloadError) {
                                console.error('Download link error:', downloadError);
                                await socket.sendMessage(sender, {
                                    text: `*❪ ERROR ❫*\n\n❌ *Download Failed!* _${downloadError.message}_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                            }
                        }
                    };

                    socket.ev.on('messages.upsert', handleDownload);

                } catch (detailsError) {
                    console.error('Thenkiri Details Error:', detailsError);
                    await socket.sendMessage(sender, {
                        text: `*❌ Thenkiri Details Error!* _${detailsError.message}_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                }
            }
        };

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('Thenkiri command error:', error);
        await socket.sendMessage(sender, {
            text: `*❌ System Error!* _${error.message || 'Unknown error'}_${DEFAULT_FOOTER}`
        }, { quoted: msg });
    }
});
