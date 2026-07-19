const { cmd } = require("../command");
const axios = require("axios");

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const movieSessions = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatLanguage(langCode) {
    const languages = {
        en: 'English', es: 'Spanish', fr: 'French',
        de: 'German', ja: 'Japanese', ko: 'Korean',
        hi: 'Hindi', cn: 'Chinese', ru: 'Russian', ta: 'Tamil'
    };
    return languages[langCode] || langCode.toUpperCase();
}

function formatCast(cast) {
    if (!cast?.length) return 'N/A';
    return cast.slice(0, 3)
        .map(a => `• ${a.name} as ${a.character || 'Unknown'}`)
        .join('\n');
}

// ── Global reply handler (registered ONCE per connection) ─────────────────────
const handleMovieReply = async (conn, mekInfo) => {
    if (!mekInfo?.message) return;

    const messageType =
        mekInfo.message?.conversation ||
        mekInfo.message?.extendedTextMessage?.text;
    if (!messageType) return;

    const isReply = !!mekInfo.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!isReply) return;

    const stanzaId = mekInfo.message.extendedTextMessage.contextInfo.stanzaId;
    const from     = mekInfo.key.remoteJid;
    const sender   = mekInfo.key.participant || from;

    const session = movieSessions.get(sender);
    if (!session)              return;
    if (session.from !== from) return;
    if (session.messageId !== stanzaId) return; // must reply to THIS search result

    if (Date.now() - session.timestamp > 300000) {
        movieSessions.delete(sender);
        await conn.sendMessage(from, { text: "❌ Session expired. Please search again." });
        return;
    }

    const userReply = messageType.trim().toUpperCase();
    let item, isMovie, detailsUrl;

    if (userReply.startsWith("M")) {
        const index = parseInt(userReply.replace("M", "")) - 1;
        if (isNaN(index) || index < 0 || index >= session.movies.length)
            return conn.sendMessage(from, { text: "❌ Invalid movie selection!" });
        item = session.movies[index];
        isMovie = true;
        detailsUrl = `https://api.themoviedb.org/3/movie/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates,videos`;
    } else if (userReply.startsWith("T")) {
        const index = parseInt(userReply.replace("T", "")) - 1;
        if (isNaN(index) || index < 0 || index >= session.tvShows.length)
            return conn.sendMessage(from, { text: "❌ Invalid TV show selection!" });
        item = session.tvShows[index];
        isMovie = false;
        detailsUrl = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`;
    } else {
        return conn.sendMessage(from, { text: "❌ Invalid selection! Use M1, T1, etc." });
    }

    movieSessions.delete(sender); // consume session immediately

    // "Fetching..." placeholder — keep ref outside try so catch can edit it
    let fetchingMsg = null;

    try {
        fetchingMsg = await conn.sendMessage(from, { text: "⏳ Fetching details..." }, { quoted: mekInfo });

        const detailsRes = await axios.get(detailsUrl);
        const details    = detailsRes.data;

        const trailer     = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const trailerLink = trailer ? `🎥 *Trailer:* https://youtu.be/${trailer.key}\n` : '';

        const title       = isMovie ? details.title : details.name;
        const releaseDate = isMovie ? details.release_date : details.first_air_date;
        const year        = releaseDate ? `(${new Date(releaseDate).getFullYear()})` : '';
        const runtime     = isMovie
            ? details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : 'N/A'
            : details.episode_run_time?.length ? `${details.episode_run_time[0]}m` : 'N/A';

        const caption =
            `🎬 *${title}* ${year} ${isMovie ? '[Movie]' : '[TV Show]'}\n\n` +
            `⭐ *Rating:* ${details.vote_average?.toFixed(1) || 'N/A'} / 10 (${details.vote_count?.toLocaleString() || 0} votes)\n` +
            `⌛ *Runtime:* ${runtime}\n` +
            `🗓️ *Release Date:* ${releaseDate || 'N/A'}\n` +
            `🌐 *Language:* ${formatLanguage(details.original_language)}\n\n` +
            `🎭 *Genres:* ${details.genres?.map(g => g.name).join(', ') || 'N/A'}\n\n` +
            `👥 *Cast:*\n${formatCast(details.credits?.cast)}\n\n` +
            `📖 *Plot:* ${details.overview || 'No description available'}\n\n` +
            `${trailerLink}\n` +
            `*𝙲𝙸𝙽𝙴𝚅𝙸𝙱𝙴𝚂 𝙻𝙺 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻*`;

        const posterPath = details.poster_path
            ? `https://image.tmdb.org/t/p/w780${details.poster_path}`
            : 'https://i.ibb.co/7QZqD0B/movie.png';

        await conn.sendMessage(from, {
            image:   { url: posterPath },
            caption: caption,
            mimetype: 'image/jpeg',
            contextInfo: {
                externalAdReply: {
                    title,
                    body: `⭐ ${details.vote_average?.toFixed(1) || 'N/A'} | ${releaseDate?.slice(0, 4) || ''}`,
                    thumbnailUrl: posterPath,
                    mediaType: 1
                }
            }
        }, { quoted: mekInfo });

        // Edit placeholder to success
        await conn.sendMessage(from, { text: '✅ Details Fetched Successfully', edit: fetchingMsg.key });

    } catch (error) {
        console.error("Movie details error:", error);
        if (fetchingMsg) {
            await conn.sendMessage(from, {
                text: `❌ *An error occurred:* ${error.message || "Error!"}`,
                edit: fetchingMsg.key
            });
        }
    }
};

// ── !minfo command ────────────────────────────────────────────────────────────
cmd({
    pattern:  "minfo",
    alias:    ["film", "moviedetails"],
    desc:     "Search and get detailed movie or TV show information with trailer",
    category: "search",
    react:    "🎬",
    filename: __filename
}, async (conn, m, mek, { from, sender, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a movie or TV show name!");

        const searchRes = await axios.get(
            `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`
        );

        if (!searchRes.data?.results?.length)
            return reply("❌ No movies or TV shows found with that name!");

        const movies  = searchRes.data.results.filter(i => i.media_type === "movie");
        const tvShows = searchRes.data.results.filter(i => i.media_type === "tv");

        let resultList = `🎬 *Search Results for "${q}"* 🎬\n\n`;

        if (movies.length) {
            resultList += `🎥 *Movies* 🎥\n`;
            movies.forEach((movie, i) => {
                const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
                resultList += `*M${i + 1}.* ${movie.title}${year !== 'N/A' ? ` (${year})` : ''}\n`;
                if (movie.overview) resultList += `   📝 ${truncateText(movie.overview, 50)}\n\n`;
            });
        } else {
            resultList += `🎥 *Movies* 🎥\nNo movies found.\n\n`;
        }

        if (tvShows.length) {
            resultList += `📺 *TV Shows* 📺\n`;
            tvShows.forEach((tv, i) => {
                const year = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 'N/A';
                resultList += `*T${i + 1}.* ${tv.name}${year !== 'N/A' ? ` (${year})` : ''}\n`;
                if (tv.overview) resultList += `   📝 ${truncateText(tv.overview, 50)}\n\n`;
            });
        } else {
            resultList += `📺 *TV Shows* 📺\nNo TV shows found.\n\n`;
        }

        resultList += `🔢 *Reply with the code (e.g., M1 for movie, T1 for TV show) to select*`;

        const sentMsg = await conn.sendMessage(from, {
            text: resultList,
            contextInfo: {
                externalAdReply: {
                    title:        "🎥 Movie & TV Search",
                    body:         `Results for: ${q}`,
                    thumbnailUrl: "https://i.ibb.co/7QZqD0B/movie.png",
                    mediaType:    1
                }
            }
        }, { quoted: mek });

        // Save session with `from` to prevent cross-chat matches
        movieSessions.set(sender, {
            timestamp: Date.now(),
            movies,
            tvShows,
            messageId: sentMsg.key.id,
            from,                        // ← fix: store chat JID
        });

        // Register handler ONCE per connection (not on every command call)
        if (!conn._movieHandlerRegistered) {
            conn.ev.on('messages.upsert', ({ messages }) => {
                const msg = messages[0];
                if (msg && !msg.key.fromMe) handleMovieReply(conn, msg);
            });
            conn._movieHandlerRegistered = true;
        }

    } catch (error) {
        console.error("Movie search error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *An error occurred:* ${error.message || "Error!"}`);
    }
});
