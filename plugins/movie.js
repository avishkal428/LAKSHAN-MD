const { cmd } = require("../command");
const axios = require("axios");
const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";

const movieSessions = new Map();

cmd({
    pattern: "minfo",
    alias: ["film", "moviedetails"],
    desc: "Search and get detailed movie or TV show information with trailer",
    category: "search",
    react: "🎬",
    filename: __filename
}, async (conn, m, mek, { from, sender, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a movie or TV show name!");

        // Search for movies and TV shows
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl);

        if (!searchRes.data?.results?.length) {
            return await reply("❌ No movies or TV shows found with that name!");
        }

        // Filter and separate movies and TV shows
        const movies = searchRes.data.results.filter(item => item.media_type === "movie");
        const tvShows = searchRes.data.results.filter(item => item.media_type === "tv");

        let resultList = `🎬 *Search Results for "${q}"* 🎬\n\n`;

        // List movies
        if (movies.length > 0) {
            resultList += `🎥 *Movies* 🎥\n`;
            movies.forEach((movie, index) => {
                const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
                resultList += `*M${index + 1}.* ${movie.title} ${year !== 'N/A' ? `(${year})` : ''}\n`;
                if (movie.overview) resultList += `   📝 ${truncateText(movie.overview, 50)}\n\n`;
            });
        } else {
            resultList += `🎥 *Movies* 🎥\nNo movies found.\n\n`;
        }

        // List TV shows
        if (tvShows.length > 0) {
            resultList += `📺 *TV Shows* 📺\n`;
            tvShows.forEach((tv, index) => {
                const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 'N/A';
                resultList += `*T${index + 1}.* ${tv.name} ${year !== 'N/A' ? `(${year})` : ''}\n`;
                if (tv.overview) resultList += `   📝 ${truncateText(tv.overview, 50)}\n\n`;
            });
        } else {
            resultList += `📺 *TV Shows* 📺\nNo TV shows found.\n\n`;
        }

        resultList += `🔢 *Reply with the code (e.g., M1 for movie, T1 for TV show) to select*`;

        // Send the result list
        const sentMsg = await conn.sendMessage(
            from,
            {
                text: resultList,
                contextInfo: {
                    externalAdReply: {
                        title: "🎥 Movie & TV Search",
                        body: `Results for: ${q}`,
                        thumbnailUrl: "https://i.ibb.co/7QZqD0B/movie.png",
                        mediaType: 1
                    }
                }
            },
            { quoted: mek }
        );

        // Store the session
        movieSessions.set(sender, {
            timestamp: Date.now(),
            movies,
            tvShows,
            messageId: sentMsg.key.id
        });

        // Listen for user reply to select an item
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            try {
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message) return;

                const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
                const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

                if (!isReplyToSentMsg) return;

                const session = movieSessions.get(sender);
                if (!session) return;
                if (Date.now() - session.timestamp > 300000) {
                    movieSessions.delete(sender);
                    return await conn.sendMessage(from, { text: "❌ Session expired. Please search again." });
                }

                const userReply = messageType.trim().toUpperCase();
                let item, isMovie, detailsUrl;

                // Check if user selected a movie or TV show
                if (userReply.startsWith("M")) {
                    const index = parseInt(userReply.replace("M", "")) - 1;
                    if (isNaN(index) || index < 0 || index >= session.movies.length) {
                        return await conn.sendMessage(from, { text: "❌ Invalid movie selection!" });
                    }
                    item = session.movies[index];
                    isMovie = true;
                    detailsUrl = `https://api.themoviedb.org/3/movie/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates,videos`;
                } else if (userReply.startsWith("T")) {
                    const index = parseInt(userReply.replace("T", "")) - 1;
                    if (isNaN(index) || index < 0 || index >= session.tvShows.length) {
                        return await conn.sendMessage(from, { text: "❌ Invalid TV show selection!" });
                    }
                    item = session.tvShows[index];
                    isMovie = false;
                    detailsUrl = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
                } else {
                    return await conn.sendMessage(from, { text: "❌ Invalid selection! Use M1, T1, etc." });
                }

                // Send "Fetching details..." message
                const msg = await conn.sendMessage(from, { text: "⏳ Fetching details..." }, { quoted: mek });

                // Fetch detailed information
                const detailsRes = await axios.get(detailsUrl);
                const details = detailsRes.data;

                // Find YouTube trailer
                const trailer = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
                const trailerLink = trailer ? `🎥 *Trailer:* https://youtu.be/${trailer.key}\n` : '';

                // Format detailed information with clean spacing
                const title = isMovie ? details.title : details.name;
                const releaseDate = isMovie ? details.release_date : details.first_air_date;
                const year = releaseDate ? `(${new Date(releaseDate).getFullYear()})` : '';
                const runtime = isMovie
                    ? details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : 'N/A'
                    : details.episode_run_time?.length ? `${details.episode_run_time[0]}m` : 'N/A';

                const caption = `🎬 *${title}* ${year} ${isMovie ? '[Movie]' : '[TV Show]'}\n\n` +
                    `⭐ *Rating:* ${details.vote_average?.toFixed(1) || 'N/A'} / 10 (${details.vote_count?.toLocaleString() || 0} votes)\n` +
                    `⌛ *Runtime:* ${runtime}\n` +
                    `🗓️ *Release Date:* ${releaseDate || 'N/A'}\n` +
                    `🌐 *Language:* ${formatLanguage(details.original_language)}\n\n` +
                    `🎭 *Genres:* ${details.genres?.map(g => g.name).join(', ') || 'N/A'}\n\n` +
                    `👥 *Cast:* \n${formatCast(details.credits?.cast)}\n\n` +
                    `📖 *Plot:* ${details.overview || 'No description available'}\n\n` +
                    `${trailerLink}\n` +
                    `*𝙲𝙸𝙽𝙴𝚅𝙸𝙱𝙴𝚂 𝙻𝙺 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻*`;

                // Send detailed information with poster
                const posterPath = details.poster_path
                    ? `https://image.tmdb.org/t/p/w780${details.poster_path}`
                    : 'https://i.ibb.co/7QZqD0B/movie.png';

                await conn.sendMessage(
                    from,
                    {
                        image: { url: posterPath },
                        caption: caption,
                        mimetype: 'image/jpeg',
                        contextInfo: {
                            externalAdReply: {
                                title: title,
                                body: `⭐ ${details.vote_average?.toFixed(1) || 'N/A'} | ${releaseDate?.slice(0, 4) || ''}`,
                                thumbnailUrl: posterPath,
                                mediaType: 1
                            }
                        }
                    },
                    { quoted: mek }
                );

                // Edit the "Fetching details..." message to "Success"
                await conn.sendMessage(from, { text: '✅ Details Fetched Successfully ✅', edit: msg.key });

                // Clear session
                movieSessions.delete(sender);

            } catch (error) {
                console.error("Error in reply handler:", error);
                await conn.sendMessage(from, { text: `❌ *An error occurred:* ${error.message || "Error!"}`, edit: msg.key });
            }
        });

    } catch (error) {
        console.error("Error in movie command:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ *An error occurred:* ${error.message || "Error!"}`);
    }
});

// Helper functions
function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatLanguage(langCode) {
    const languages = {
        en: 'English', es: 'Spanish', fr: 'French',
        de: 'German', ja: 'Japanese', ko: 'Korean',
        hi: 'Hindi', cn: 'Chinese', ru: 'Russian',
        ta: 'Tamil'
    };
    return languages[langCode] || langCode.toUpperCase();
}

function formatCast(cast) {
    if (!cast?.length) return 'N/A';
    return cast.slice(0, 3).map(actor => 
        `• ${actor.name} as ${actor.character || 'Unknown'}`
    ).join('\n');
                                       }
