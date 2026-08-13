const { cmd, commands } = require('../command');
const scraper = require("liyanaarachchi-sinhalasub-scraper-v2");
const axios = require("axios");
const cheerio = require("cheerio");

// Map to handle user sessions
const sessions = new Map();

function clearSession(jid) {
    if (sessions.has(jid)) {
        const session = sessions.get(jid);
        if (session.timeout) clearTimeout(session.timeout);
        sessions.delete(jid);
    }
}

const DEFAULT_FOOTER = "\n\n> *Powered by LAKSHAN-MD*";

function getMimeType(url) {
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    switch (ext) {
        case "mp4": return "video/mp4";
        case "mkv": return "video/x-matroska";
        case "avi": return "video/x-msvideo";
        case "mov": return "video/quicktime";
        case "webm": return "video/webm";
        default: return "video/mp4";
    }
}

async function getMovieDetails(movieUrl) {
    try {
        const { data } = await axios.get(movieUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            }
        });
        const $ = cheerio.load(data);

        const title = $("div.mvic-desc h3").text().trim() || $("h1.entry-title").text().trim() || "Unknown";
        const poster = $("div.mvic-thumb img").attr("src") || $("div.thumb img").attr("src") || "";

        let releaseDate = "Unknown", country = "Unknown", duration = "Unknown", genres = "Unknown", language = "Unknown", director = "Unknown", rating = "Unknown", quality = "Unknown";

        $("div.mvic-info p, div.mvici-right p").each((_, el) => {
            const text = $(el).text();
            if (text.includes("Country:")) country = text.replace("Country:", "").trim() || "Unknown";
            if (text.includes("Release:")) releaseDate = text.replace("Release:", "").trim() || "Unknown";
            if (text.includes("Duration:")) duration = text.replace("Duration:", "").trim() || "Unknown";
            if (text.includes("Genre:") || text.includes("Genres:")) genres = text.replace(/Genre:|Genres:/g, "").trim() || "Unknown";
            if (text.includes("Language:")) language = text.replace("Language:", "").trim() || "Unknown";
            if (text.includes("Director:")) director = text.replace("Director:", "").trim() || "Unknown";
            if (text.includes("IMDb:") || text.includes("Rating:")) rating = text.replace(/IMDb:|Rating:/g, "").trim() || "Unknown";
            if (text.includes("Quality:")) quality = text.replace("Quality:", "").trim() || "Unknown";
        });

        if (releaseDate === "Unknown") {
            const yearMatch = title.match(/\((\d{4})\)/);
            if (yearMatch) releaseDate = yearMatch[1];
        }

        return { title, poster, releaseDate, country, duration, genres, language, director, rating, quality };
    } catch (err) {
        return { title: "Unknown", poster: "", releaseDate: "Unknown", country: "Unknown", duration: "Unknown", genres: "Unknown", language: "Unknown", director: "Unknown", rating: "Unknown", quality: "Unknown" };
    }
}

// Main Command
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
                return await reply("❌ Please provide a movie name or select a number (e.g. .ss rrr OR .ss 1)." + DEFAULT_FOOTER);
            }

            const activeUser = from; // 'from' භාවිතා කිරීමෙන් Self-chat ගැටලුව විසඳේ

            // අංකයක් පමණක් එවූ විට ( Selection Handling )
            if (!isNaN(q) && sessions.has(activeUser)) {
                const session = sessions.get(activeUser);
                const choice = parseInt(q);

                // Step 1: Movie Select කිරීම
                if (session.step === "WAITING_MOVIE_SELECTION") {
                    if (choice < 1 || choice > session.results.length) {
                        return await reply(`❌ Invalid choice. Please select between 1 and ${session.results.length}.`);
                    }

                   
                    const selectedMovie = session.results[choice - 1];

                    let downloadLinks = [];
                    try { downloadLinks = await scraper.getMovieLinks(selectedMovie.link); } catch (e) { downloadLinks = []; }

                    if (!downloadLinks || downloadLinks.length === 0) {
                        clearSession(activeUser);
                        return await reply("❌ No download links available for this movie." + DEFAULT_FOOTER);
                    }

                    const details = await getMovieDetails(selectedMovie.link);
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
                        `💬 Reply with *.ss <number>* (e.g. .ss 1) to download.` +
                        DEFAULT_FOOTER;

                    session.step = "WAITING_QUALITY_SELECTION";
                    session.selectedMovie = { ...selectedMovie, title: movieTitle };
                    session.downloadLinks = downloadLinks;

                    if (details.poster && conn.sendFromUrl) {
                        await conn.sendFromUrl(from, details.poster, detailsCard, mek);
                    } else {
                        await reply(detailsCard);
                    }
                    return;
                }

                // Step 2: Quality Select කිරීම
                if (session.step === "WAITING_QUALITY_SELECTION") {
                    if (choice < 1 || choice > session.downloadLinks.length) {
                        return await reply(`❌ Invalid option. Choose between 1 and ${session.downloadLinks.length}.`);
                    }

                    const selectedDl = session.downloadLinks[choice - 1];
                    const movieTitle = session.selectedMovie.title;

                    const qualityMatch = selectedDl.label.match(/\d{3,4}p/i);
                    const qualityStr = qualityMatch ? qualityMatch[0] : "HD";
                    const sizeMatch = selectedDl.label.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
                    const sizeStr = sizeMatch ? sizeMatch[0] : "Unknown";

                    const docCaption = `🎬 ${movieTitle}\n\n🎞️ ${qualityStr}\n\n💾 ${sizeStr}` + DEFAULT_FOOTER;

                    if (m.react) await m.react("📥");
                    await reply("📥 *Downloading movie file to server... Please wait.*" + DEFAULT_FOOTER);

                    const mimeType = getMimeType(selectedDl.link);
                    const safeFileName = `${movieTitle.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

                    await conn.sendMessage(
                        from,
                        { document: { url: selectedDl.link }, mimetype: mimeType, fileName: safeFileName, caption: docCaption },
                        { quoted: mek }
                    );

                    if (m.react) await m.react("✅");
                    clearSession(activeUser);
                    return;
                }
            }

            // අලුතින් Movie එකක් Search කරන අවස්ථාව
            if (m.react) await m.react("🔎");
            const searchResults = await scraper.searchSinhalaSub(q);

            if (!searchResults || searchResults.length === 0) {
                if (m.react) await m.react("❌");
                return await reply("❌ No movies found." + DEFAULT_FOOTER);
            }

            const results = searchResults.slice(0, 10);
            let msg = "━━━━━━━━━━━━━━━━━━\n\n🔎 *SINHALASUB SEARCH*\n\n";
            results.forEach((item, index) => {
                msg += `${index + 1}.\n${item.title}\n\n`;
            });
            msg += "━━━━━━━━━━━━━━━━━━\n\n💬 Reply with *.ss <number>* (e.g. *.ss 3*)" + DEFAULT_FOOTER;

            clearSession(activeUser);

            const timeout = setTimeout(() => {
                if (sessions.has(activeUser)) {
                    sessions.delete(activeUser);
                }
            }, 5 * 60 * 1000);

            sessions.set(activeUser, {
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
