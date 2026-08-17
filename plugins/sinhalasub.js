const { cmd } = require("../command");
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");

// Map to handle active user/chat sessions
const sessions = new Map();

// Global Default Footer
const DEFAULT_FOOTER = "\n\n> *Powered by KIRA-MD*";

// Clear session & timers
function clearSession(key) {
    if (sessions.has(key)) {
        const session = sessions.get(key);
        if (session.timeout) clearTimeout(session.timeout);
        sessions.delete(key);
    }
}

// Reset session inactivity timer (5 minutes)
function refreshTimeout(key, reply) {
    const session = sessions.get(key);
    if (!session) return;
    if (session.timeout) clearTimeout(session.timeout);
    session.timeout = setTimeout(() => {
        if (sessions.has(key)) {
            sessions.delete(key);
            reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
        }
    }, 5 * 60 * 1000);
}

// Helper to convert Pixeldrain URL to direct API download hotlink
function getDirectDownloadUrl(url) {
    if (!url) return url;
    const pdMatch = url.match(/pixeldrain\.com\/(?:u|file)\/([a-zA-Z0-9]+)/i);
    if (pdMatch && pdMatch[1]) {
        return `https://pixeldrain.com/api/file/${pdMatch[1]}?download`;
    }
    return url;
}

// Determine MIME type
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

// Scrape details & poster card image from SinhalaSub page
async function getMovieDetails(movieUrl) {
    try {
        const { data } = await axios.get(movieUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            },
            timeout: 10000
        });
        const $ = cheerio.load(data);

        const title =
            $("div.mvic-desc h3").text().trim() ||
            $("h1.entry-title").text().trim() ||
            $("div.single-post-title h1").text().trim() ||
            "Unknown";

        let poster =
            $("div.mvic-thumb img").attr("src") ||
            $("div.thumb img").attr("src") ||
            $("div.poster img").attr("src") ||
            $('meta[property="og:image"]').attr("content") ||
            "";

        if (poster && poster.startsWith("//")) {
            poster = "https:" + poster;
        }

        let releaseDate = "Unknown";
        let country = "Unknown";
        let duration = "Unknown";
        let genres = "Unknown";
        let language = "Unknown";
        let director = "Unknown";
        let rating = "Unknown";
        let quality = "Unknown";

        $("div.mvic-info p, div.mvici-right p, div.mvi-content p").each((_, el) => {
            const text = $(el).text().trim();
            if (/Country:/i.test(text)) country = text.replace(/Country:/i, "").trim() || "Unknown";
            if (/Release:/i.test(text)) releaseDate = text.replace(/Release:/i, "").trim() || "Unknown";
            if (/Duration:/i.test(text)) duration = text.replace(/Duration:/i, "").trim() || "Unknown";
            if (/Genre:|Genres:/i.test(text)) genres = text.replace(/Genre:|Genres:/gi, "").trim() || "Unknown";
            if (/Language:/i.test(text)) language = text.replace(/Language:/i, "").trim() || "Unknown";
            if (/Director:/i.test(text)) director = text.replace(/Director:/i, "").trim() || "Unknown";
            if (/IMDb:|Rating:/i.test(text)) rating = text.replace(/IMDb:|Rating:/gi, "").trim() || "Unknown";
            if (/Quality:/i.test(text)) quality = text.replace(/Quality:/i, "").trim() || "Unknown";
        });

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

// Send Movie Document
async function sendMovieDocument(conn, from, link, title, label, mek, m) {
    const directUrl = getDirectDownloadUrl(link);
    const qualityMatch = label.match(/\b(1080p|720p|480p|2160p|4K|HD|FHD|SD)\b/i);
    const qualityStr = qualityMatch ? qualityMatch[0].toUpperCase() : "HD";

    const sizeMatch = label.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
    const sizeStr = sizeMatch ? sizeMatch[0] : "Unknown";

    const docCaption =
        `🎬 ${title}\n\n` +
        `🎞️ ${qualityStr}\n\n` +
        `💾 ${sizeStr}` +
        DEFAULT_FOOTER;

    if (m && m.react) await m.react("📥");

    const mimeType = getMimeType(directUrl);
    const safeFileName = `${title.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

    if (m && m.react) await m.react("⬆️");

    await conn.sendMessage(
        from,
        {
            document: { url: directUrl },
            mimetype: mimeType,
            fileName: safeFileName,
            caption: docCaption
        },
        { quoted: mek }
    );

    if (m && m.react) await m.react("✅");
}

// Helper to parse multi-select reply options (e.g. "1", "1,3", "1-5", "ALL")
function parseSelections(inputStr, maxCount) {
    const str = inputStr.trim().toUpperCase();
    let selectedIndices = [];

    if (str === "ALL") {
        return Array.from({ length: maxCount }, (_, i) => i);
    }
    
    // Range: "1-5"
    if (/^\d+\s*-\s*\d+$/.test(str)) {
        const parts = str.split("-").map((p) => parseInt(p.trim()));
        const start = Math.min(parts[0], parts[1]);
        const end = Math.max(parts[0], parts[1]);
        if (start < 1 || end > maxCount) return null;
        for (let i = start; i <= end; i++) {
            selectedIndices.push(i - 1);
        }
        return selectedIndices;
    }

    // Custom List: "1,2,4"
    if (/^\d+(?:\s*,\s*\d+)+$/.test(str)) {
        const parts = str.split(",").map((p) => parseInt(p.trim()));
        for (const num of parts) {
            if (isNaN(num) || num < 1 || num > maxCount) return null;
            if (!selectedIndices.includes(num - 1)) {
                selectedIndices.push(num - 1);
            }
        }
        return selectedIndices;
    }

    // Single Number: "1"
    if (/^\d+$/.test(str)) {
        const num = parseInt(str);
        if (num < 1 || num > maxCount) return null;
        selectedIndices.push(num - 1);
        return selectedIndices;
    }

    return null;
}

// Primary SinhalaSub Command
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
            const input = q ? q.trim() : "";
            const sessionKey = from || sender;

            if (!input) {
                if (m.react) await m.react("❌");
                return await reply("❌ Please provide a movie/series name to search." + DEFAULT_FOOTER);
            }

            if (m.react) await m.react("🔎");

            const rawResults = await scraper.searchSinhalaSub(input);

            if (!rawResults || rawResults.length === 0) {
                if (m.react) await m.react("❌");
                return await reply("❌ No movies found." + DEFAULT_FOOTER);
            }

            // Filter out category navigation links
            const filteredResults = rawResults.filter((item) => {
                if (!item.title) return false;
                const lower = item.title.toLowerCase().trim();
                return (
                    !lower.includes("movie lanuage") &&
                    !lower.includes("movie language") &&
                    !lower.includes("tv shows") &&
                    !lower.includes("tv show") &&
                    !lower.includes("category") &&
                    !lower.includes("home")
                );
            });

            if (filteredResults.length === 0) {
                if (m.react) await m.react("❌");
                return await reply("❌ No movies found." + DEFAULT_FOOTER);
            }

            const results = filteredResults.slice(0, 10);

            let msg = "━━━━━━━━━━━━━━━━━━\n\n🔎 *SINHALASUB SEARCH*\n\n";
            results.forEach((item, index) => {
                msg += `${index + 1}.\n${item.title}\n\n`;
            });
            msg += "━━━━━━━━━━━━━━━━━━\n\n💬 Reply with the movie number." + DEFAULT_FOOTER;

            clearSession(sessionKey);

            const timeout = setTimeout(() => {
                if (sessions.has(sessionKey)) {
                    sessions.delete(sessionKey);
                    reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
                }
            }, 5 * 60 * 1000);

            sessions.set(sessionKey, {
                step: "WAITING_MOVIE_SELECTION",
                results,
                timeout
            });

            await reply(msg);
        } catch (error) {
            console.error("SinhalaSub search command error:", error);
            if (m.react) await m.react("❌");
            await reply("❌ An error occurred while searching. Please try again." + DEFAULT_FOOTER);
        }
    }
);

// Listener for sequential plain number / choice responses
cmd(
    {
        on: "text"
    },
    async (conn, mek, m, { from, reply, sender }) => {
        try {
            const sessionKey = from || sender;
            if (!sessions.has(sessionKey)) return;

            const session = sessions.get(sessionKey);
            const body = m.text ? m.text.trim() : "";

            // Reject prefix commands from hijacking active session
            if (body.startsWith(".") || body.startsWith("/") || body.startsWith("!")) return;

            // STEP 1: MOVIE / SERIES SELECTION (Plain Number)
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

                let downloadLinks = [];
                try {
                    downloadLinks = await scraper.getMovieLinks(selectedMovie.link);
                } catch (e) {
                    downloadLinks = [];
                }

                if (!downloadLinks || downloadLinks.length === 0) {
                    clearSession(sessionKey);
                    if (m.react) await m.react("❌");
                    return await reply("❌ No download links available for this selection." + DEFAULT_FOOTER);
                }

                // Prioritize Pixeldrain direct links
                const pixeldrainLinks = downloadLinks.filter(
                    (dl) => dl.link && dl.link.toLowerCase().includes("pixeldrain")
                );
                const activeLinks = pixeldrainLinks.length > 0 ? pixeldrainLinks : downloadLinks;

                const details = await getMovieDetails(selectedMovie.link);
                const movieTitle = details.title !== "Unknown" ? details.title : selectedMovie.title;

                // Detect TV Series
                const isTVSeries = activeLinks.some(
                    (dl) =>
                        /ep|episode|s\d+e\d+/i.test(dl.label || "") ||
                        / episode /i.test(dl.label || "")
                );

                if (isTVSeries) {
                    let epText = "";
                    activeLinks.forEach((dl, idx) => {
                        epText += `${idx + 1}️⃣ ${dl.label || "Episode"}\n`;
                    });

                    const epCard =
                        `☘️ *TɪᴛʟE* ➯ *_${movieTitle}_*\n\n` +
                        `*❑ 📅 𝗥ᴇʟᴇᴀꜱᴇ 𝗗ᴀᴛᴇ* ➯ *_${details.releaseDate}_*\n` +
                        `*❑ 🌎 𝗖ᴏᴜɴᴛ𝗥ʏ* ➯ *_${details.country}_*\n` +
                        `*❑ ⏱️ 𝗗ᴜ𝗥ᴀᴛɪᴏɴ* ➯ *_${details.duration}_*\n` +
                        `*❑ 🎭 𝗚ᴇɴʀᴇꜱ* ➯ *_${details.genres}_*\n` +
                        `*❑ 🗣️ 𝗟ᴀɴɢᴜᴀɢE* ➯ *_${details.language}_*\n` +
                        `*❑ 👨🏻‍💼 𝗗ɪʀᴇᴄᴛᴏ𝗥* ➯ *_${details.director}_*\n` +
                        `*❑ ⭐ 𝗥ᴀᴛɪɴɢ* ➯ *_${details.rating}_*\n` +
                        `*❑ 🎞️ 𝗤ᴜᴀʟɪᴛʏ* ➯ *_${details.quality}_*\n\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `📺 *Available Episodes*\n\n` +
                        `${epText}\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `💬 Reply with options:\n` +
                        `• Single Episode: Reply *2*\n` +
                        `• Range: Reply *1-5*\n` +
                        `• Custom List: Reply *2,4,6*\n` +
                        `• All Episodes: Reply *ALL*` +
                        DEFAULT_FOOTER;

                    session.step = "WAITING_EPISODE_SELECTION";
                    session.selectedMovie = { ...selectedMovie, title: movieTitle };
                    session.episodes = activeLinks;
                    refreshTimeout(sessionKey, reply);

                    if (details.poster && details.poster.trim() !== "" && conn.sendFromUrl) {
                        try {
                            await conn.sendFromUrl(from, details.poster, epCard, mek);
                        } catch (err) {
                            await reply(epCard);
                        }
                    } else {
                        await reply(epCard);
                    }
                    return;
                }

                // Standard Movie Quality Details Card
                let downloadsText = "";
                activeLinks.forEach((dl, idx) => {
                    downloadsText += `${idx + 1}️⃣ ${dl.label || "Direct Link"}\n`;
                });

                const detailsCard =
                    `☘️ *TɪᴛʟE* ➯ *_${movieTitle}_*\n\n` +
                    `*❑ 📅 𝗥ᴇʟᴇᴀꜱᴇ 𝗗ᴀᴛᴇ* ➯ *_${details.releaseDate}_*\n` +
                    `*❑ 🌎 𝗖ᴏᴜɴᴛ𝗥ʏ* ➯ *_${details.country}_*\n` +
                    `*❑ ⏱️ 𝗗ᴜ𝗥ᴀᴛɪᴏɴ* ➯ *_${details.duration}_*\n` +
                    `*❑ 🎭 𝗚ᴇɴʀᴇꜱ* ➯ *_${details.genres}_*\n` +
                    `*❑ 🗣️ 𝗟ᴀɴɢᴜᴀɢE* ➯ *_${details.language}_*\n` +
                    `*❑ 👨🏻‍💼 𝗗ɪʀᴇᴄᴛᴏ𝗥* ➯ *_${details.director}_*\n` +
                    `*❑ ⭐ 𝗥ᴀᴛɪɴɢ* ➯ *_${details.rating}_*\n` +
                    `*❑ 🎞️ 𝗤ᴜᴀʟɪᴛʏ* ➯ *_${details.quality}_*\n\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `📥 *Available Downloads*\n\n` +
                    `${downloadsText}\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `💬 Reply with quality numbers (e.g., *1*, *1,2*, or *ALL*).` +
                    DEFAULT_FOOTER;

                session.step = "WAITING_QUALITY_SELECTION";
                session.selectedMovie = { ...selectedMovie, title: movieTitle };
                session.downloadLinks = activeLinks;
                refreshTimeout(sessionKey, reply);

                if (details.poster && details.poster.trim() !== "" && conn.sendFromUrl) {
                    try {
                        await conn.sendFromUrl(from, details.poster, detailsCard, mek);
                    } catch (err) {
                        await reply(detailsCard);
                    }
                } else {
                    await reply(detailsCard);
                }
                return;
            }

            // STEP 2A: TV SERIES EPISODE SELECTION
            if (session.step === "WAITING_EPISODE_SELECTION") {
                const epList = session.episodes;
                const selectedIndices = parseSelections(body, epList.length);

                if (!selectedIndices || selectedIndices.length === 0) {
                    if (m.react) await m.react("❌");
                    return await reply(
                        `❌ Invalid selection. Available episodes: 1 to ${epList.length}.\nExamples:\n• Single: 2\n• Range: 1-5\n• Custom: 1,3\n• All: ALL` +
                            DEFAULT_FOOTER
                    );
                }

                await reply(
                    `📥 *Starting download for ${selectedIndices.length} item(s)...*` +
                        DEFAULT_FOOTER
                );

                for (const idx of selectedIndices) {
                    const ep = epList[idx];
                    const epTitle = `${session.selectedMovie.title} - ${ep.label || `Episode ${idx + 1}`}`;
                    await sendMovieDocument(conn, from, ep.link, epTitle, ep.label || "HD", mek, m);
                }

                // Keep session open so user can pick other episodes/qualities within timer
                refreshTimeout(sessionKey, reply);
                return;
            }

            // STEP 2B: MOVIE QUALITY SELECTION
            if (session.step === "WAITING_QUALITY_SELECTION") {
                const dlList = session.downloadLinks;
                const selectedIndices = parseSelections(body, dlList.length);

                if (!selectedIndices || selectedIndices.length === 0) {
                    if (m.react) await m.react("❌");
                    return await reply(
                        `❌ Invalid choice. Reply with a valid quality number (1 to ${dlList.length}) or multi-option (e.g., 1,2).` +
                            DEFAULT_FOOTER
                    );
                }

                await reply(
                    `📥 *Sending ${selectedIndices.length} requested file(s)...*` +
                        DEFAULT_FOOTER
                );

                for (const idx of selectedIndices) {
                    const selectedDl = dlList[idx];
                    const movieTitle = session.selectedMovie.title;
                    await sendMovieDocument(conn, from, selectedDl.link, movieTitle, selectedDl.label, mek, m);
                }

                // Keep session open so user can pick another quality option
                refreshTimeout(sessionKey, reply);
            }
        } catch (error) {
            console.error("SinhalaSub text handler error:", error);
            if (m.react) await m.react("❌");
            await reply("❌ Error processing request. Please search again." + DEFAULT_FOOTER);
            clearSession(from || sender);
        }
    }
);
