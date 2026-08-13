const { cmd, commands } = require('../command');
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");


// Map to handle user sessions
// Key: sender JID, Value: session object
const sessions = new Map();

// Helper to clean up session
function clearSession(jid) {
    if (sessions.has(jid)) {
        const session = sessions.get(jid);
        if (session.timeout) clearTimeout(session.timeout);
        sessions.delete(jid);
    }
}

// Global Default Footer
const DEFAULT_FOOTER = "\n\n> *Powered by LASHAN-MD*";

// Helper to determine mime type from URL or extension
function getMimeType(url) {
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    switch (ext) {
        case "mp4":
            return "video/mp4";
        case "mkv":
            return "video/x-matroska";
        case "avi":
            return "video/x-msvideo";
        case "mov":
            return "video/quicktime";
        case "webm":
            return "video/webm";
        default:
            return "video/mp4";
    }
}

// Scrape detailed movie info using axios and cheerio if needed
async function getMovieDetails(movieUrl) {
    try {
        const { data } = await axios.get(movieUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            }
        });
        const $ = cheerio.load(data);

        const title =
            $("div.mvic-desc h3").text().trim() ||
            $("h1.entry-title").text().trim() ||
            "Unknown";
        const poster =
            $("div.mvic-thumb img").attr("src") ||
            $("div.thumb img").attr("src") ||
            "";

        let releaseDate = "Unknown";
        let country = "Unknown";
        let duration = "Unknown";
        let genres = "Unknown";
        let language = "Unknown";
        let director = "Unknown";
        let rating = "Unknown";
        let quality = "Unknown";

        // Parse meta details from info block
        $("div.mvic-info p, div.mvici-right p").each((_, el) => {
            const text = $(el).text();
            if (text.includes("Country:"))
                country = text.replace("Country:", "").trim() || "Unknown";
            if (text.includes("Release:"))
                releaseDate = text.replace("Release:", "").trim() || "Unknown";
            if (text.includes("Duration:"))
                duration = text.replace("Duration:", "").trim() || "Unknown";
            if (text.includes("Genre:") || text.includes("Genres:")) {
                genres = text
                    .replace(/Genre:|Genres:/g, "")
                    .trim() || "Unknown";
            }
            if (text.includes("Language:"))
                language = text.replace("Language:", "").trim() || "Unknown";
            if (text.includes("Director:"))
                director = text.replace("Director:", "").trim() || "Unknown";
            if (text.includes("IMDb:") || text.includes("Rating:")) {
                rating = text.replace(/IMDb:|Rating:/g, "").trim() || "Unknown";
            }
            if (text.includes("Quality:"))
                quality = text.replace("Quality:", "").trim() || "Unknown";
        });

        // Fallback for year from release date or title
        if (releaseDate === "Unknown") {
            const yearMatch = title.match(/\((\d{4})\)/);
            if (yearMatch) releaseDate = yearMatch[1];
        }

        return {
            title,
            poster,
            releaseDate,
            country,
            duration,
            genres,
            language,
            director,
            rating,
            quality
        };
    } catch (err) {
        return {
            title: "Unknown",
            poster: "",
            releaseDate: "Unknown",
            country: "Unknown",
            duration: "Unknown",
            genres: "Unknown",
            language: "Unknown",
            director: "Unknown",
            rating: "Unknown",
            quality: "Unknown"
        };
    }
}

// Primary SinhalaSub Search Command
cmd(
    {
        pattern: "sinhalasub",
        alias: ["ss", "sub"],
        desc: "Search movies from SinhalaSub.lk",
        category: "movie",
        react: "🎬",
        filename: __filename
    },
    async (conn, mek, m, { from, q, reply, sender }) => {
        try {
            if (!q) {
                if (m.react) await m.react("❌");
                return await reply(
                    "❌ Please provide a movie name to search." + DEFAULT_FOOTER
                );
            }

            if (m.react) await m.react("🔎");

            const searchResults = await scraper.searchSinhalaSub(q);

            if (!searchResults || searchResults.length === 0) {
                if (m.react) await m.react("❌");
                return await reply("❌ No movies found." + DEFAULT_FOOTER);
            }

            // Limit to max 10 results
            const results = searchResults.slice(0, 10);

            let msg = "━━━━━━━━━━━━━━━━━━\n\n🔎 *SINHALASUB SEARCH*\n\n";
            results.forEach((item, index) => {
                msg += `${index + 1}.\n${item.title}\n\n`;
            });
            msg += "━━━━━━━━━━━━━━━━━━\n\n💬 Reply with the movie number." + DEFAULT_FOOTER;

            // Clear any existing active session for this user
            clearSession(sender);

            // Set session with 5 min timeout
            const timeout = setTimeout(() => {
                if (sessions.has(sender)) {
                    sessions.delete(sender);
                    reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
                }
            }, 5 * 60 * 1000);

            sessions.set(sender, {
                step: "WAITING_MOVIE_SELECTION",
                results,
                timeout
            });

            await reply(msg);
        } catch (error) {
            console.error("SinhalaSub command error:", error);
            if (m.react) await m.react("❌");
            await reply("❌ An error occurred while searching. Please try again later." + DEFAULT_FOOTER);
        }
    }
);

// Incoming message listener for interactive user selection step
cmd(
    {
        on: "text"
    },
    async (conn, mek, m, { from, reply, sender }) => {
        try {
            if (!sessions.has(sender)) return;

            const session = sessions.get(sender);
            const body = m.text ? m.text.trim() : "";

            // User selected a movie from search results
            if (session.step === "WAITING_MOVIE_SELECTION") {
                const choice = parseInt(body);
                if (isNaN(choice) || choice < 1 || choice > session.results.length) {
                    if (m.react) await m.react("❌");
                    return await reply(
                        `❌ Invalid choice. Please reply with a number between 1 and ${session.results.length}.` +
                            DEFAULT_FOOTER
                    );
                }

                if (m.react) await m.react("📋");

                const selectedMovie = session.results[choice - 1];

                // Fetch direct download links using scraper
                let downloadLinks = [];
                try {
                    downloadLinks = await scraper.getMovieLinks(selectedMovie.link);
                } catch (e) {
                    downloadLinks = [];
                }

                if (!downloadLinks || downloadLinks.length === 0) {
                    clearSession(sender);
                    if (m.react) await m.react("❌");
                    return await reply("❌ No download links available for this movie." + DEFAULT_FOOTER);
                }

                // Fetch scraped details for metadata display
                const details = await getMovieDetails(selectedMovie.link);

                // Build download options list text
                let downloadsText = "";
                downloadLinks.forEach((dl, idx) => {
                    downloadsText += `${idx + 1}️⃣ ${dl.label || "Direct Link"}\n`;
                });

                const movieTitle = details.title !== "Unknown" ? details.title : selectedMovie.title;

                const detailsCard =
                    `☘️ *Tɪᴛʟᴇ* ➯ *_${movieTitle}_*\n\n` +
                    `*❑ 📅 𝗥ᴇʟᴇᴀꜱᴇ 𝗗ᴀᴛᴇ* ➯ *_${details.releaseDate}_*\n` +
                    `*❑ 🌎 𝗖ᴏᴜɴᴛ𝗥ʏ* ➯ *_${details.country}_*\n` +
                    `*❑ ⏱️ 𝗗ᴜʀᴀᴛɪᴏɴ* ➯ *_${details.duration}_*\n` +
                    `*❑ 🎭 𝗚ᴇɴʀᴇꜱ* ➯ *_${details.genres}_*\n` +
                    `*❑ 🗣️ 𝗟ᴀɴɢᴜᴀɢᴇ* ➯ *_${details.language}_*\n` +
                    `*❑ 👨🏻‍💼 𝗗ɪʀᴇᴄᴛᴏ𝗥* ➯ *_${details.director}_*\n` +
                    `*❑ ⭐ 𝗥ᴀᴛɪɴɢ* ➯ *_${details.rating}_*\n` +
                    `*❑ 🎞️ 𝗤ᴜᴀʟɪᴛʏ* ➯ *_${details.quality}_*\n\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `📥 *Available Downloads*\n\n` +
                    `${downloadsText}\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `💬 Reply with the quality number.` +
                    DEFAULT_FOOTER;

                // Reset timeout for next input
                if (session.timeout) clearTimeout(session.timeout);
                session.timeout = setTimeout(() => {
                    if (sessions.has(sender)) {
                        sessions.delete(sender);
                        reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
                    }
                }, 5 * 60 * 1000);

                session.step = "WAITING_QUALITY_SELECTION";
                session.selectedMovie = { ...selectedMovie, title: movieTitle };
                session.downloadLinks = downloadLinks;

                // Send image card if poster exists, otherwise send text
                if (details.poster && conn.sendFromUrl) {
                    await conn.sendFromUrl(from, details.poster, detailsCard, mek);
                } else {
                    await reply(detailsCard);
                }
                return;
            }

            // User selected quality option for download
            if (session.step === "WAITING_QUALITY_SELECTION") {
                const choice = parseInt(body);
                if (isNaN(choice) || choice < 1 || choice > session.downloadLinks.length) {
                    if (m.react) await m.react("❌");
                    return await reply(
                        `❌ Invalid quality option. Please reply with a number between 1 and ${session.downloadLinks.length}.` +
                            DEFAULT_FOOTER
                    );
                }

                const selectedDl = session.downloadLinks[choice - 1];
                const movieTitle = session.selectedMovie.title;

                // Parse label info for caption
                const qualityMatch = selectedDl.label.match(/\d{3,4}p/i);
                const qualityStr = qualityMatch ? qualityMatch[0] : "HD";

                const sizeMatch = selectedDl.label.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
                const sizeStr = sizeMatch ? sizeMatch[0] : "Unknown";

                const docCaption =
                    `🎬 ${movieTitle}\n\n` +
                    `🎞️ ${qualityStr}\n\n` +
                    `💾 ${sizeStr}` +
                    DEFAULT_FOOTER;

                if (m.react) await m.react("📥");

                // Notify user download is starting
                await reply("📥 *Downloading movie file to server... Please wait.*" + DEFAULT_FOOTER);

                if (m.react) await m.react("⬆️");

                const mimeType = getMimeType(selectedDl.link);
                const safeFileName = `${movieTitle.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

                // Upload movie file as document
                await conn.sendMessage(
                    from,
                    {
                        document: { url: selectedDl.link },
                        mimetype: mimeType,
                        fileName: safeFileName,
                        caption: docCaption
                    },
                    { quoted: mek }
                );

                if (m.react) await m.react("✅");

                // Delete active session on success
                clearSession(sender);
            }
        } catch (error) {
            console.error("SinhalaSub interactive handler error:", error);
            if (m.react) await m.react("❌");
            await reply("❌ Error processing your request. Please try searching again." + DEFAULT_FOOTER);
            clearSession(sender);
        }
    }
);
