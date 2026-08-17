const { cmd } = require('../command');
const scraper = require('liyanaarachchi-sinhalasub-scraper-v2');
const axios = require('axios');
const cheerio = require('cheerio');

// Map to handle stateful context-based message sessions
const sessionStore = new Map();

const DEFAULT_FOOTER = `\n\n> 🧬 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃`;
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500";

// Helper to convert Pixeldrain URL to direct API download hotlink
function getDirectDownloadUrl(url) {
    if (!url) return url;
    const pdMatch = url.match(/pixeldrain\.com\/(?:u|file)\/([a-zA-Z0-9]+)/i);
    if (pdMatch && pdMatch[1]) {
        return `https://pixeldrain.com/api/file/${pdMatch[1]}?download`;
    }
    return url;
}

// Scrape details & poster card image from SinhalaSub page
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
        let poster = $("div.mvic-thumb img").attr("src") || $("div.thumb img").attr("src") || $('meta[property="og:image"]').attr("content") || "";

        if (poster && poster.startsWith("//")) {
            poster = "https:" + poster;
        }

        let releaseDate = "Unknown", country = "Unknown", duration = "Unknown", rating = "Unknown";

        $("div.mvic-info p, div.mvici-right p").each((_, el) => {
            const text = $(el).text().trim();
            if (/Country:/i.test(text)) country = text.replace(/Country:/i, "").trim();
            if (/Release:/i.test(text)) releaseDate = text.replace(/Release:/i, "").trim();
            if (/Duration:/i.test(text)) duration = text.replace(/Duration:/i, "").trim();
            if (/IMDb:|Rating:/i.test(text)) rating = text.replace(/IMDb:|Rating:/gi, "").trim();
        });

        return { title, poster, releaseDate, country, duration, rating };
    } catch (err) {
        return { title: "Unknown", poster: "", releaseDate: "Unknown", country: "Unknown", duration: "Unknown", rating: "Unknown" };
    }
}

// Helper to parse inputs: "2", "1,3", "1-5", "ALL"
function parseSelections(inputStr, maxCount) {
    const str = inputStr.trim().toUpperCase();
    let selectedIndices = [];

    if (str === "ALL") {
        return Array.from({ length: maxCount }, (_, i) => i);
    }

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

    if (/^\d+(?:\s*,\s*\d+)+$/.test(str)) {
        const parts = str.split(",").map((p) => parseInt(p.trim()));
        for (const num of parts) {
            if (isNaN(num) || num < 1 || num > maxCount) return null;
            if (!selectedIndices.includes(num - 1)) selectedIndices.push(num - 1);
        }
        return selectedIndices;
    }

    if (/^\d+$/.test(str)) {
        const num = parseInt(str);
        if (num < 1 || num > maxCount) return null;
        selectedIndices.push(num - 1);
        return selectedIndices;
    }

    return null;
}

// Send Movie Document
async function sendMovieDocument(socket, sender, link, title, label, quotedMsg) {
    const directUrl = getDirectDownloadUrl(link);
    const qualityMatch = label.match(/\b(1080p|720p|480p|2160p|4K|HD|FHD|SD)\b/i);
    const qualityStr = qualityMatch ? qualityMatch[0].toUpperCase() : "HD";
    const sizeMatch = label.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
    const sizeStr = sizeMatch ? sizeMatch[0] : "Unknown";

    const safeFileName = `${title.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

    try {
        await socket.sendMessage(sender, {
            document: { url: directUrl },
            mimetype: "video/mp4",
            fileName: safeFileName,
            caption: `*❪ SINHALASUB ❫*\n\n🎭 *${title}*\n📌 *Quality:* _${qualityStr}_\n💾 *Size:* _${sizeStr}_${DEFAULT_FOOTER}`
        }, { quoted: quotedMsg });

        await socket.sendMessage(sender, { react: { text: "✅", key: quotedMsg.key } });
    } catch (err) {
        // Fallback Direct Link
        await socket.sendMessage(sender, {
            text: `*❪ DIRECT LINK ❫*\n\n🎬 *Title:* ${title}\n📌 *Quality:* ${qualityStr}\n\n🔗 *Download Link:* \n${directUrl}\n\n💡 _File size is too large to upload directly. Use the direct link above to download via your browser!_${DEFAULT_FOOTER}`
        }, { quoted: quotedMsg });

        await socket.sendMessage(sender, { react: { text: "🔗", key: quotedMsg.key } });
    }
}

// 1️⃣ Main Command Definition
cmd({
    pattern: "sinhalasub",
    alias: ["ss", "sub"],
    desc: "Search and download movies/series from SinhalaSub.lk",
    category: "download",
    react: "🎬"
},
async (socket, msg, m, { from, args }) => {
    const sender = from;

    if (!args.length) {
        return await socket.sendMessage(sender, {
            text: `*❪ ERROR ❫*\n\n⚠️ *Invalid Usage!*\n\n🎬 *Example:*\n• .sinhalasub deadpool\n• .ss batman\n\n📝 _Please provide a search term!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
    }

    const searchQuery = args.join(" ");
    await socket.sendMessage(sender, {
        text: `*❪ SEARCHING ❫*\n\n🔍 *Searching SinhalaSub...*\n⚡ _Please wait a moment._`
    });

    try {
        const rawResults = await scraper.searchSinhalaSub(searchQuery);

        if (!rawResults || rawResults.length === 0) {
            return await socket.sendMessage(sender, {
                text: `*❪ NO RESULTS ❫*\n\n😞 *No Results Found!*\n🎯 *Query:* _${searchQuery}_${DEFAULT_FOOTER}`
            }, { quoted: msg });
        }

        const filteredResults = rawResults.filter((item) => {
            if (!item.title) return false;
            const lower = item.title.toLowerCase().trim();
            return !lower.includes("movie language") && !lower.includes("tv shows") && !lower.includes("category");
        });

        const results = filteredResults.slice(0, 15);

        let listText = `*❪ SEARCH RESULTS ❫*\n\n🎯 *Query:* _${searchQuery}_\n📊 *Results:* _${results.length} Items_\n\n*👇 REPLY WITH A NUMBER 👇*\n\n`;

        results.forEach((item, index) => {
            const num = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
            listText += `*${num}* ➜ 🎥 _${item.title}_\n`;
        });

        listText += DEFAULT_FOOTER;

        const sentMsg = await socket.sendMessage(sender, { text: listText }, { quoted: msg });

        // Bind message ID to session
        sessionStore.set(sentMsg.key.id, {
            type: "WAITING_MOVIE_SELECTION",
            sender,
            results
        });

    } catch (error) {
        console.error("SinhalaSub error:", error);
        await socket.sendMessage(sender, {
            text: `*❪ SYSTEM ERROR ❫*\n\n❌ *Error processing search request!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
    }
});

// 2️⃣ Universal Session Listener for Plain Number Replies
cmd({
    on: "text"
},
async (socket, msg, m, { from }) => {
    const text = m.text ? m.text.trim() : "";
    if (text.startsWith(".") || text.startsWith("/") || text.startsWith("!")) return;

    // Retrieve context ID of the message being replied to
    const targetStanzaId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!targetStanzaId || !sessionStore.has(targetStanzaId)) return;

    const session = sessionStore.get(targetStanzaId);

    // Context Safety Verification
    if (session.sender !== from) return;

    // STEP 1: Process Search Result Selection
    if (session.type === "WAITING_MOVIE_SELECTION") {
        const choice = parseInt(text) - 1;
        if (isNaN(choice) || choice < 0 || choice >= session.results.length) {
            return await socket.sendMessage(from, {
                text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Choice!*\n🎯 *Range:* _01 - ${session.results.length}_${DEFAULT_FOOTER}`
            }, { quoted: msg });
        }

        const selectedMovie = session.results[choice];
        await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            const downloadLinks = await scraper.getMovieLinks(selectedMovie.link);
            if (!downloadLinks || downloadLinks.length === 0) {
                return await socket.sendMessage(from, {
                    text: `*❪ NO DOWNLOADS ❫*\n\n⚠️ *No Download links available for this item!_${DEFAULT_FOOTER}`
                }, { quoted: msg });
            }

            const details = await getMovieDetails(selectedMovie.link);
            const movieTitle = details.title !== "Unknown" ? details.title : selectedMovie.title;
            const posterUrl = details.poster || DEFAULT_IMAGE;

            let downloadsText = `*❪ MOVIE DETAILS ❫*\n\n🎬 *Title:* ${movieTitle}\n📅 *Release:* ${details.releaseDate}\n⭐ *IMDb Rating:* ${details.rating}\n🌎 *Country:* ${details.country}\n\n*👇 SELECT OPTION / QUALITY 👇*\n\n`;

            downloadLinks.forEach((dl, idx) => {
                const num = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
                downloadsText += `*${num}* ➜ 📥 *${dl.label || "Direct Link"}*\n`;
            });

            downloadsText += `\n💬 *REPLY WITH YOUR CHOICE*\n📌 _Multi-select options: Reply *1*, *1,2*, *1-3*, or *ALL*_${DEFAULT_FOOTER}`;

            // Send Detail Card with Poster
            const downloadCardMsg = await socket.sendMessage(from, {
                image: { url: posterUrl },
                caption: downloadsText
            }, { quoted: msg });

            // Set Step 2 Session mapped to the newly sent Download Card Stanza ID
            sessionStore.set(downloadCardMsg.key.id, {
                type: "WAITING_DOWNLOAD_SELECTION",
                sender: from,
                movieTitle,
                downloadLinks
            });

            await socket.sendMessage(from, { react: { text: "📋", key: msg.key } });

        } catch (err) {
            console.error("Link Retrieval error:", err);
            await socket.sendMessage(from, {
                text: `*❪ ERROR ❫*\n\n❌ *Failed to fetch download links!_${DEFAULT_FOOTER}`
            }, { quoted: msg });
        }
    }

    // STEP 2: Process Quality / Episode Selection
    if (session.type === "WAITING_DOWNLOAD_SELECTION") {
        const dlList = session.downloadLinks;
        const selectedIndices = parseSelections(text, dlList.length);

        if (!selectedIndices || selectedIndices.length === 0) {
            return await socket.sendMessage(from, {
                text: `*❪ INVALID ❫*\n\n⚠️ *Invalid Selection Format!*\n🎯 *Examples:* _1_, _1,2_, _1-3_, or _ALL_${DEFAULT_FOOTER}`
            }, { quoted: msg });
        }

        await socket.sendMessage(from, { react: { text: "📥", key: msg.key } });

        for (const idx of selectedIndices) {
            const selectedDl = dlList[idx];
            await sendMovieDocument(socket, from, selectedDl.link, session.movieTitle, selectedDl.label || "HD", msg);
        }
    }
});
