const { cmd } = require("../command");
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");

const TMDB_API_KEY = "267e38d9f7dd69a9f609d281ed878515";
const DEFAULT_FOOTER = "\n\n*𝙲𝙸𝙽𝙴𝚅𝙸𝙱𝙴𝚂 𝙻𝙺 𝙾𝙵𝙵𝙸𝙲𝙸𝙰𝙻*";

// Global Active Sessions Store
const movieSessions = new Map();

// Helper Functions
function clearSession(jid) {
    if (movieSessions.has(jid)) {
        const session = movieSessions.get(jid);
        if (session.timeout) clearTimeout(session.timeout);
        movieSessions.delete(jid);
    }
}

function getMimeType(url) {
    if (!url) return "video/mp4";
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    return ext === "mp4" ? "video/mp4" : "video/x-matroska";
}

function formatLanguage(langCode) {
    const languages = {
        en: 'English', es: 'Spanish', fr: 'French', de: 'German',
        ja: 'Japanese', ko: 'Korean', hi: 'Hindi', cn: 'Chinese',
        ru: 'Russian', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam'
    };
    return languages[langCode] || (langCode ? langCode.toUpperCase() : 'N/A');
}

function formatCast(cast) {
    if (!cast || !cast.length) return 'N/A';
    return cast.slice(0, 3).map(actor => `• ${actor.name} as ${actor.character || 'Unknown'}`).join('\n');
}

// Web scraper fallback for site movie details
async function getMovieDetails(movieUrl) {
    try {
        const { data } = await axios.get(movieUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" 
            },
            timeout: 10000
        });
        const $ = cheerio.load(data);

        const title = $("div.mvic-desc h3").text().trim() || $("h1.entry-title").text().trim() || "Unknown";
        const poster = $("div.mvic-thumb img").attr("src") || $("div.thumb img").attr("src") || "";
        let details = { title, poster, release: "N/A", duration: "N/A", genres: "N/A", rating: "N/A" };

        $("div.mvic-info p, div.mvici-right p").each((_, el) => {
            const text = $(el).text();
            if (text.includes("Release:")) details.release = text.replace("Release:", "").trim();
            if (text.includes("Duration:")) details.duration = text.replace("Duration:", "").trim();
            if (text.includes("Genre:")) details.genres = text.replace("Genre:", "").trim();
            if (text.includes("IMDb:")) details.rating = text.replace("IMDb:", "").trim();
        });
        return details;
    } catch (e) { 
        return { title: "Unknown", poster: "", release: "N/A", duration: "N/A", genres: "N/A", rating: "N/A" }; 
    }
}

// MAIN COMMAND: .movie / .sinhalasub
cmd({
    pattern: "movie",
    alias: ["ss", "sub", "sinhalasub", "minfo"],
    desc: "Search movies from SinhalaSub & TMDB and download",
    category: "movie",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply("❌ Please provide a movie name to search!");

        await reply("🔎 *Searching for movies on SinhalaSub... Please wait.*");

        const rawResults = await scraper.searchSinhalaSub(q);
        
        if (!rawResults || rawResults.length === 0) {
            return reply("❌ No movies found for your search term." + DEFAULT_FOOTER);
        }

        // Clean Menu/Category links
        const results = rawResults.filter(item => {
            if (!item.title || !item.link) return false;
            const titleLower = item.title.toLowerCase();
            return !titleLower.includes("movie lanuage") && 
                   !titleLower.includes("tv shows") && 
                   !titleLower.includes("genre") &&
                   !titleLower.includes("category") &&
                   item.link.includes("sinhalasub");
        }).slice(0, 10);

        if (results.length === 0) {
            return reply("❌ No valid movie titles found. Please try another search." + DEFAULT_FOOTER);
        }

        let msg = `🎬 *SINHALASUB SEARCH RESULTS FOR "${q.toUpperCase()}"*\n\n`;
        results.forEach((item, index) => { 
            msg += `*${index + 1}.* ${item.title}\n`; 
        });
        msg += "\n💬 *Reply with the number (1-10) to select the movie.*" + DEFAULT_FOOTER;

        clearSession(sender);

        const timeout = setTimeout(() => {
            if (movieSessions.has(sender)) {
                clearSession(sender);
            }
        }, 5 * 60 * 1000); // 5 Minutes Timeout

        movieSessions.set(sender, { step: "WAITING_MOVIE_SELECTION", results, timeout, from });

        await conn.sendMessage(from, {
            text: msg,
            contextInfo: {
                externalAdReply: {
                    title: "🎥 Movie Search Engine",
                    body: `Results for: ${q}`,
                    thumbnailUrl: "https://i.ibb.co/7QZqD0B/movie.png",
                    mediaType: 1
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Movie command error:", error);
        await reply("❌ An error occurred while searching: " + error.message + DEFAULT_FOOTER);
    }
});

// INTERACTIVE REPLY HANDLER (Runs safely on user input)
cmd({ on: "text" }, async (conn, mek, m, { from, reply, sender, body }) => {
    try {
        if (!movieSessions.has(sender)) return;
        const session = movieSessions.get(sender);

        const input = body ? body.trim() : "";
        if (!input || isNaN(input)) return; // Reject if not a valid number

        // STEP 1: Select Movie and Fetch Complete TMDB + Web Details
        if (session.step === "WAITING_MOVIE_SELECTION") {
            const choice = parseInt(input);
            if (choice < 1 || choice > session.results.length) {
                return reply(`❌ Invalid selection. Please reply with a number between 1 and ${session.results.length}.`);
            }

            const selectedMovie = session.results[choice - 1];
            await reply("⏳ *Fetching detailed movie info & qualities...*");

            // Direct Links & Web Scraper Details
            let downloadLinks = await scraper.getMovieLinks(selectedMovie.link).catch(() => []);
            let webDetails = await getMovieDetails(selectedMovie.link);

            // Fetch Detailed Info from TMDB API
            let tmdbDetails = null;
            try {
                const tmdbSearch = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(selectedMovie.title)}`);
                if (tmdbSearch.data?.results?.length > 0) {
                    const movieId = tmdbSearch.data.results[0].id;
                    const tmdbReq = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
                    tmdbDetails = tmdbReq.data;
                }
            } catch (err) {
                console.log("TMDB Fetch Error: Skipped to web scraper details.");
            }

            if (!downloadLinks || downloadLinks.length === 0) {
                clearSession(sender);
                return reply("❌ No download links found for this movie." + DEFAULT_FOOTER);
            }

            // Limit to top 3 qualities
            const availableQualities = downloadLinks.slice(0, 3);

            let downloadsText = "";
            availableQualities.forEach((dl, idx) => { 
                downloadsText += `*${idx + 1}️⃣* ${dl.quality || dl.label || "Direct Download"} (${dl.size || "HD"})\n`; 
            });

            // Map variables
            const title = tmdbDetails?.title || webDetails.title || selectedMovie.title;
            const releaseDate = tmdbDetails?.release_date || webDetails.release;
            const year = releaseDate && releaseDate !== 'N/A' ? `(${new Date(releaseDate).getFullYear()})` : '';
            const rating = tmdbDetails?.vote_average ? `${tmdbDetails.vote_average.toFixed(1)} / 10 (${tmdbDetails.vote_count?.toLocaleString() || 0} votes)` : webDetails.rating;
            const runtime = tmdbDetails?.runtime ? `${Math.floor(tmdbDetails.runtime / 60)}h ${tmdbDetails.runtime % 60}m` : webDetails.duration;
            const genres = tmdbDetails?.genres?.map(g => g.name).join(", ") || webDetails.genres;
            const language = formatLanguage(tmdbDetails?.original_language);
            const cast = formatCast(tmdbDetails?.credits?.cast);
            const overview = tmdbDetails?.overview || "No description available.";
            const poster = tmdbDetails?.poster_path ? `https://image.tmdb.org/t/p/w780${tmdbDetails.poster_path}` : webDetails.poster;

            // Trailer Link
            const trailer = tmdbDetails?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            const trailerLink = trailer ? `🎥 *Trailer:* https://youtu.be/${trailer.key}\n` : '';

            // Formatting rich caption
            const detailsCard = 
                `🎬 *${title}* ${year}\n\n` +
                `⭐ *Rating:* ${rating}\n` +
                `⌛ *Runtime:* ${runtime}\n` +
                `🗓️ *Release Date:* ${releaseDate}\n` +
                `🌐 *Language:* ${language}\n\n` +
                `🎭 *Genres:* ${genres}\n\n` +
                `👥 *Cast:* \n${cast}\n\n` +
                `📖 *Plot:* ${overview}\n\n` +
                `${trailerLink}` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📥 *SELECT DOWNLOAD QUALITY*\n\n` +
                `${downloadsText}\n` +
                `💬 *Reply with the quality number (1-${availableQualities.length}) to download.*` +
                DEFAULT_FOOTER;

            // Session Timeout Refresh
            if (session.timeout) clearTimeout(session.timeout);
            session.timeout = setTimeout(() => {
                if (movieSessions.has(sender)) clearSession(sender);
            }, 5 * 60 * 1000);

            session.step = "WAITING_QUALITY_SELECTION";
            session.selectedMovieTitle = title;
            session.availableQualities = availableQualities;

            if (poster) {
                await conn.sendMessage(from, { 
                    image: { url: poster }, 
                    caption: detailsCard,
                    contextInfo: {
                        externalAdReply: {
                            title: title,
                            body: `⭐ ${tmdbDetails?.vote_average?.toFixed(1) || 'N/A'} | ${releaseDate?.slice(0, 4) || ''}`,
                            thumbnailUrl: poster,
                            mediaType: 1
                        }
                    }
                }, { quoted: mek });
            } else {
                await reply(detailsCard);
            }
        } 
        // STEP 2: Handle Download Selection and Send Document File
        else if (session.step === "WAITING_QUALITY_SELECTION") {
            const choice = parseInt(input);
            if (choice < 1 || choice > session.availableQualities.length) {
                return reply(`❌ Invalid choice. Please reply with a number between 1 and ${session.availableQualities.length}.`);
            }

            const selectedDl = session.availableQualities[choice - 1];
            await reply("📥 *Downloading and uploading movie file... Please wait.*" + DEFAULT_FOOTER);

            const safeFileName = `${session.selectedMovieTitle.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

            await conn.sendMessage(from, {
                document: { url: selectedDl.link },
                mimetype: getMimeType(selectedDl.link),
                fileName: safeFileName,
                caption: `🎬 *${session.selectedMovieTitle}*\n📌 *Quality:* ${selectedDl.quality || selectedDl.label || 'Direct Link'}\n` + DEFAULT_FOOTER
            }, { quoted: mek });

            clearSession(sender);
        }
    } catch (error) {
        console.error("Interactive handler error:", error);
        await reply("❌ Error processing request: " + error.message + DEFAULT_FOOTER);
        clearSession(sender);
    }
});
