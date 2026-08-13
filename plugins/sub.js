const { cmd } = require("../command");
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");

// User Sessions මතක තබා ගැනීමට
const sessions = new Map();
const DEFAULT_FOOTER = "\n\n> *Powered by LASHAN-MD*";

function clearSession(jid) {
    if (sessions.has(jid)) {
        const session = sessions.get(jid);
        if (session.timeout) clearTimeout(session.timeout);
        sessions.delete(jid);
    }
}

function getMimeType(url) {
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    return ext === "mp4" ? "video/mp4" : "video/x-matroska";
}

// Web scraping for movie details
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
        
        let details = { title, poster, release: "N/A", country: "N/A", duration: "N/A", genres: "N/A", director: "N/A", rating: "N/A", quality: "N/A" };

        $("div.mvic-info p, div.mvici-right p").each((_, el) => {
            const text = $(el).text();
            if (text.includes("Country:")) details.country = text.replace("Country:", "").trim();
            if (text.includes("Release:")) details.release = text.replace("Release:", "").trim();
            if (text.includes("Duration:")) details.duration = text.replace("Duration:", "").trim();
            if (text.includes("Genre:")) details.genres = text.replace("Genre:", "").trim();
            if (text.includes("Director:")) details.director = text.replace("Director:", "").trim();
            if (text.includes("IMDb:")) details.rating = text.replace("IMDb:", "").trim();
            if (text.includes("Quality:")) details.quality = text.replace("Quality:", "").trim();
        });
        return details;
    } catch (e) { 
        return { title: "Unknown", poster: "", release: "N/A", country: "N/A", duration: "N/A", genres: "N/A", director: "N/A", rating: "N/A", quality: "N/A" }; 
    }
}

// .movie Command එක
cmd({
    pattern: "movie",
    alias: ["ss", "sub", "sinhalasub"],
    desc: "Search and download movies from SinhalaSub",
    category: "movie",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return reply("❌ Please provide a movie name to search.");
        
        await reply("🔎 *Searching for movies... Please wait.*");

        const rawResults = await scraper.searchSinhalaSub(q);
        
        if (!rawResults || rawResults.length === 0) {
            return reply("❌ No movies found for your search term." + DEFAULT_FOOTER);
        }

        // වැරදි Header/Menu Links අයින් කර ෆිල්ම් විතරක් Filter කරගැනීම
        const results = rawResults.filter(item => 
            item.title && 
            !item.title.toLowerCase().includes("movie lanuage") && 
            !item.title.toLowerCase().includes("tv shows") &&
            !item.title.toLowerCase().includes("genre")
        ).slice(0, 10);

        if (results.length === 0) {
            return reply("❌ No valid movie titles found." + DEFAULT_FOOTER);
        }

        let msg = "🔎 *SINHALASUB SEARCH RESULTS*\n\n";
        results.forEach((item, index) => { 
            msg += `*${index + 1}.* ${item.title}\n`; 
        });
        msg += "\n💬 *Reply with the number to select the movie.*" + DEFAULT_FOOTER;

        clearSession(sender);
        
        // විනාඩි 5ක timeout එකක් තැබීම
        const timeout = setTimeout(() => {
            if (sessions.has(sender)) {
                sessions.delete(sender);
            }
        }, 5 * 60 * 1000);

        sessions.set(sender, { step: "WAITING_MOVIE_SELECTION", results, timeout, from });
        
        await reply(msg);
    } catch (error) {
        console.error("Movie search error:", error);
        await reply("❌ An error occurred while searching: " + error.message + DEFAULT_FOOTER);
    }
});

// User දාන 1, 2, 3 වගේ Numbers අල්ලා ගන්නා Event Handler එක
cmd({ on: "body" }, async (conn, mek, m, { from, reply, sender, body }) => {
    try {
        if (!sessions.has(sender)) return;
        const session = sessions.get(sender);
        
        const input = body ? body.trim() : "";
        if (!input || isNaN(input)) return; // ඉලක්කමක් නෙමේ නම් Ignore කරයි

        // Step 1: චිත්‍රපටය තෝරා ගැනීම
        if (session.step === "WAITING_MOVIE_SELECTION") {
            const choice = parseInt(input);
            if (choice < 1 || choice > session.results.length) {
                return reply(`❌ Invalid choice. Please reply with a number between 1 and ${session.results.length}.`);
            }

            const selectedMovie = session.results[choice - 1];
            await reply("⏳ *Fetching movie details & download links...*");

            const [downloadLinks, details] = await Promise.all([
                scraper.getMovieLinks(selectedMovie.link).catch(() => []),
                getMovieDetails(selectedMovie.link)
            ]);

            if (!downloadLinks || downloadLinks.length === 0) {
                clearSession(sender);
                return reply("❌ No download links found for this movie." + DEFAULT_FOOTER);
            }

            let downloadsText = "";
            downloadLinks.forEach((dl, idx) => { 
                downloadsText += `*${idx + 1}️⃣* ${dl.label || "Direct Link"}\n`; 
            });

            const movieTitle = details.title !== "Unknown" ? details.title : selectedMovie.title;

            const detailsCard = 
                `🎬 *${movieTitle}*\n\n` +
                `⭐ *Rating:* ${details.rating}\n` +
                `🗓️ *Release:* ${details.release}\n` +
                `⌛ *Duration:* ${details.duration}\n` +
                `🎭 *Genres:* ${details.genres}\n` +
                `👨🏻‍💼 *Director:* ${details.director}\n` +
                `🎞️ *Quality:* ${details.quality}\n\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `📥 *AVAILABLE DOWNLOADS*\n\n` +
                `${downloadsText}\n` +
                `💬 *Reply with the quality number to download.*` +
                DEFAULT_FOOTER;

            if (session.timeout) clearTimeout(session.timeout);
            session.timeout = setTimeout(() => {
                if (sessions.has(sender)) clearSession(sender);
            }, 5 * 60 * 1000);

            session.step = "WAITING_QUALITY_SELECTION";
            session.selectedMovieTitle = movieTitle;
            session.downloadLinks = downloadLinks;

            if (details.poster) {
                await conn.sendMessage(from, { image: { url: details.poster }, caption: detailsCard }, { quoted: mek });
            } else {
                await reply(detailsCard);
            }
        } 
        // Step 2: Download Quality එක තෝරා ගැනීම
        else if (session.step === "WAITING_QUALITY_SELECTION") {
            const choice = parseInt(input);
            if (choice < 1 || choice > session.downloadLinks.length) {
                return reply(`❌ Invalid quality selection. Please reply between 1 and ${session.downloadLinks.length}.`);
            }

            const selectedDl = session.downloadLinks[choice - 1];
            await reply("📥 *Downloading movie file... Please wait.*" + DEFAULT_FOOTER);

            const safeFileName = `${session.selectedMovieTitle.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

            await conn.sendMessage(from, {
                document: { url: selectedDl.link },
                mimetype: getMimeType(selectedDl.link),
                fileName: safeFileName,
                caption: `🎬 *${session.selectedMovieTitle}*\n\n` + DEFAULT_FOOTER
            }, { quoted: mek });

            clearSession(sender);
        }
    } catch (error) {
        console.error("Movie interactive handler error:", error);
        await reply("❌ Error processing request: " + error.message + DEFAULT_FOOTER);
        clearSession(sender);
    }
});
