const { cmd } = require("../command");
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");

// Map to handle user sessions
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
const DEFAULT_FOOTER = "\n\n> *Powered by KIRA-MD*";

// Helper to convert Pixeldrain viewing/file URL into direct download hotlink URL
function getDirectDownloadUrl(url) {
    if (!url) return url;
    const pdMatch = url.match(/pixeldrain\.com\/(?:u|file)\/([a-zA-Z0-9]+)/i);
    if (pdMatch && pdMatch[1]) {
        return `https://pixeldrain.com/api/file/${pdMatch[1]}?download`;
    }
    return url;
}

// Determine MIME type based on file extension
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

// Scrape detailed HTML data (title, metadata, poster) from target URL
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

// Send single video document to chat
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

// Reset 5-minute inactivity timer
function refreshTimeout(sender, reply) {
    const session = sessions.get(sender);
    if (!session) return;
    if (session.timeout) clearTimeout(session.timeout);
    session.timeout = setTimeout(() => {
        if (sessions.has(sender)) {
            sessions.delete(sender);
            reply("⏱️ Session expired due to inactivity." + DEFAULT_FOOTER).catch(() => {});
        }
    }, 5 * 60 * 1000);
}

// Command Definition
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

            // Filter menu category noise
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

            clearSession(sender);

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
            await reply("❌ An error occurred while searching. Please try again." + DEFAULT_FOOTER);
        }
    }
);

// Listener for sequential plain text / number selection replies
cmd(
    {
        on: "text"
    },
    async (conn, mek, m, { from, reply, sender }) => {
        try {
            if (!sessions.has(sender)) return;

            const session = sessions.get(sender);
            const body = m.text ? m.text.trim() : "";

            // Reject prefix commands from hijacking active session
            if (body.startsWith(".")) return;

            // STEP 1: MOVIE / SERIES SELECTION
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
                    clearSession(sender);
                    if (m.react) await m.react("❌");
                    return await reply("❌ No download links available for this selection." + DEFAULT_FOOTER);
                }

                // Filter Pixeldrain links prioritized
                const pixeldrainLinks = downloadLinks.filter(
                    (dl) => dl.link && dl.link.toLowerCase().includes("pixeldrain")
                );
                const activeLinks = pixeldrainLinks.length > 0 ? pixeldrainLinks : downloadLinks;

                const details = await getMovieDetails(selectedMovie.link);
                const movieTitle = details.title !== "Unknown" ? details.title : selectedMovie.title;

                // Detect TV Series by checking for episode labels
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
                        `☘️ *Tɪᴛʟᴇ* ➯ *_${movieTitle}_*\n\n` +
                        `*❑ 📅 𝗥ᴇʟᴇᴀꜱᴇ 𝗗ᴀᴛᴇ* ➯ *_${details.releaseDate}_*\n` +
                        `*❑ 🌎 𝗖ᴏᴜɴᴛ𝗥ʏ* ➯ *_${details.country}_*\n` +
                        `*❑ ⏱️ 𝗗ᴜ𝗥ᴀᴛɪᴏɴ* ➯ *_${details.duration}_*\n` +
                        `*❑ 🎭 𝗚ᴇɴʀᴇꜱ* ➯ *_${details.genres}_*\n` +
                        `*❑ 🗣️ 𝗟ᴀɴɢᴜᴀɢᴇ* ➯ *_${details.language}_*\n` +
                        `*❑ 👨🏻‍💼 𝗗ɪʀᴇᴄᴛᴏ𝗥* ➯ *_${details.director}_*\n` +
                        `*❑ ⭐ 𝗥ᴀᴛɪɴɢ* ➯ *_${details.rating}_*\n` +
                        `*❑ 🎞️ 𝗤ᴜᴀʟɪᴛʏ* ➯ *_${details.quality}_*\n\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `📺 *Available Episodes*\n\n` +
                        `${epText}\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `💬 Reply with options:\n` +
                        `• Single Episode: Reply with episode number (e.g. 2)\n` +
                        `• All Episodes: Reply *ALL*\n` +
                        `• Range: Reply *1-10*\n` +
                        `• Custom List: Reply *2,5,6*` +
                        DEFAULT_FOOTER;

                    session.step = "WAITING_EPISODE_SELECTION";
                    session.selectedMovie = { ...selectedMovie, title: movieTitle };
                    session.episodes = activeLinks;
                    refreshTimeout(sender, reply);

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

                // Standard Movie Quality Options
                let downloadsText = "";
                activeLinks.forEach((dl, idx) => {
                    downloadsText += `${idx + 1}️⃣ ${dl.label || "Direct Link"}\n`;
                });

                const detailsCard =
                    `☘️ *Tɪᴛʟᴇ* ➯ *_${movieTitle}_*\n\n` +
                    `*❑ 📅 𝗥ᴇʟᴇᴀꜱᴇ 𝗗ᴀᴛᴇ* ➯ *_${details.releaseDate}_*\n` +
                    `*❑ 🌎 𝗖ᴏᴜɴᴛ𝗥ʏ* ➯ *_${details.country}_*\n` +
                    `*❑ ⏱️ 𝗗ᴜ𝗥ᴀᴛɪᴏɴ* ➯ *_${details.duration}_*\n` +
                    `*❑ 🎭 𝗚ᴇɴ𝗥ᴇꜱ* ➯ *_${details.genres}_*\n` +
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

                session.step = "WAITING_QUALITY_SELECTION";
                session.selectedMovie = { ...selectedMovie, title: movieTitle };
                session.downloadLinks = activeLinks;
                refreshTimeout(sender, reply);

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
                const totalEps = epList.length;
                let selectedIndices = [];

                const inputStr = body.trim().toUpperCase();

                // Option: "ALL"
                if (inputStr === "ALL") {
                    selectedIndices = Array.from({ length: totalEps }, (_, i) => i);
                }
                // Option: Range "1-10"
                else if (/^\d+\s*-\s*\d+$/.test(inputStr)) {
                    const parts = inputStr.split("-").map((p) => parseInt(p.trim()));
                    const start = Math.min(parts[0], parts[1]);
                    const end = Math.max(parts[0], parts[1]);

                    if (start < 1 || end > totalEps) {
                        if (m.react) await m.react("❌");
                        return await reply(
                            `❌ Range out of bounds. Available episodes: 1 to ${totalEps}.` +
                                DEFAULT_FOOTER
                        );
                    }
                    for (let i = start; i <= end; i++) {
                        selectedIndices.push(i - 1);
                    }
                }
                // Option: Custom list "2,5,6"
                else if (/^\d+(?:\s*,\s*\d+)+$/.test(inputStr)) {
                    const parts = inputStr.split(",").map((p) => parseInt(p.trim()));
                    for (const num of parts) {
                        if (isNaN(num) || num < 1 || num > totalEps) {
                            if (m.react) await m.react("❌");
                            return await reply(
                                `❌ Invalid episode number ${num}. Available episodes: 1 to ${totalEps}.` +
                                    DEFAULT_FOOTER
                            );
                        }
                        if (!selectedIndices.includes(num - 1)) {
                            selectedIndices.push(num - 1);
                        }
                    }
                }
                // Option: Single episode number "2"
                else if (/^\d+$/.test(inputStr)) {
                    const num = parseInt(inputStr);
                    if (num < 1 || num > totalEps) {
                        if (m.react) await m.react("❌");
                        return await reply(
                            `❌ Invalid choice. Reply with a number between 1 and ${totalEps}.` +
                                DEFAULT_FOOTER
                        );
                    }
                    selectedIndices.push(num - 1);
                } else {
                    if (m.react) await m.react("❌");
                    return await reply(
                        `❌ Invalid format. Examples:\n• Single: 2\n• All: ALL\n• Range: 1-5\n• Custom: 2,4,6` +
                            DEFAULT_FOOTER
                    );
                }

                await reply(
                    `📥 *Starting download for ${selectedIndices.length} episode(s)...*` +
                        DEFAULT_FOOTER
                );

                for (const idx of selectedIndices) {
                    const ep = epList[idx];
                    const epTitle = `${session.selectedMovie.title} - ${ep.label || `Episode ${idx + 1}`}`;
                    await sendMovieDocument(conn, from, ep.link, epTitle, ep.label || "HD", mek, m);
                }

                clearSession(sender);
                return;
            }

            // STEP 2B: MOVIE QUALITY SELECTION
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

                await sendMovieDocument(conn, from, selectedDl.link, movieTitle, selectedDl.label, mek, m);

                clearSession(sender);
            }
        } catch (error) {
            console.error("SinhalaSub Text Listener Error:", error);
            if (m.react) await m.react("❌");
            await reply("❌ Error processing request. Please try searching again." + DEFAULT_FOOTER);
            clearSession(sender);
        }
    }
);
