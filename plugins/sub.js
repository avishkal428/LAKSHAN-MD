const { cmd } = require("../command");
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");

const sessions = new Map();
const DEFAULT_FOOTER = "\n\n> *Powered by LASHAN-MD*";

// Helper functions
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

// Scraper functions (SinhalaSub)
async function getMovieDetails(movieUrl) {
    try {
        const { data } = await axios.get(movieUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" }
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

// Main Command
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
        
        const searchResults = await scraper.searchSinhalaSub(q);
        if (!searchResults || searchResults.length === 0) return reply("❌ No movies found.");

        const results = searchResults.slice(0, 10);
        let msg = "🔎 *SINHALASUB SEARCH RESULTS*\n\n";
        results.forEach((item, index) => { msg += `*${index + 1}.* ${item.title}\n`; });
        msg += "\n💬 *Reply with the number to select the movie.*" + DEFAULT_FOOTER;

        clearSession(sender);
        
        const timeout = setTimeout(() => {
            if (sessions.has(sender)) {
                sessions.delete(sender);
                reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
            }
        }, 5 * 60 * 1000);

        sessions.set(sender, { step: "WAITING_MOVIE_SELECTION", results, timeout });
        
        await reply(msg);
    } catch (error) {
        console.error("Movie search error:", error);
        await reply("❌ An error occurred while searching." + DEFAULT_FOOTER);
    }
});

// Interactive Handler
cmd({ on: "text" }, async (conn, mek, m, { from, reply, sender }) => {
    try {
        if (!sessions.has(sender)) return;
        const session = sessions.get(sender);
        const body = m.text ? m.text.trim() : "";

        // Step 1: User picks movie
        if (session.step === "WAITING_MOVIE_SELECTION") {
            const choice = parseInt(body);
            if (isNaN(choice) || choice < 1 || choice > session.results.length) return reply("❌ Invalid choice.");

            const selectedMovie = session.results[choice - 1];
            const [downloadLinks, details] = await Promise.all([
                scraper.getMovieLinks(selectedMovie.link),
                getMovieDetails(selectedMovie.link)
            ]);

            if (!downloadLinks || downloadLinks.length === 0) {
                clearSession(sender);
                return reply("❌ No download links found.");
            }

            let downloadsText = "";
            downloadLinks.forEach((dl, idx) => { downloadsText += `*${idx + 1}️⃣* ${dl.label}\n`; });

            const detailsCard = 
                `🎬 *${details.title}*\n\n` +
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
                if (sessions.has(sender)) {
                    sessions.delete(sender);
                    reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
                }
            }, 5 * 60 * 1000);

            session.step = "WAITING_QUALITY_SELECTION";
            session.selectedMovieTitle = details.title !== "Unknown" ? details.title : selectedMovie.title;
            session.downloadLinks = downloadLinks;

            if (details.poster) {
                await conn.sendMessage(from, { image: { url: details.poster }, caption: detailsCard }, { quoted: mek });
            } else {
                await reply(detailsCard);
            }
        } 
        // Step 2: User picks quality
        else if (session.step === "WAITING_QUALITY_SELECTION") {
            const choice = parseInt(body);
            if (isNaN(choice) || choice < 1 || choice > session.downloadLinks.length) return reply("❌ Invalid quality selection.");

            const selectedDl = session.downloadLinks[choice - 1];
            await reply("📥 *Downloading movie... Please wait.*" + DEFAULT_FOOTER);

            await conn.sendMessage(from, {
                document: { url: selectedDl.link },
                mimetype: getMimeType(selectedDl.link),
                fileName: `${session.selectedMovieTitle.replace(/[/\\?%*:|"<>]/g, "")}.mp4`,
                caption: `🎬 *${session.selectedMovieTitle}*\n\n` + DEFAULT_FOOTER
            }, { quoted: mek });

            clearSession(sender);
        }
    } catch (error) {
        console.error("Movie interactive handler error:", error);
        clearSession(sender);
    }
});
