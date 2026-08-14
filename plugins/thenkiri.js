const { cmd } = require('../command');
const thenkiri = require('liyanaarachchi-thenkiri-scrap');

cmd({
    pattern: "thenkiri",
    alias: ["tk", "thenkiridl"],
    desc: "Search and download movies or shows from Thenkiri",
    category: "download",
    react: "🎥",
},
async (socket, msg, m, { from, args }) => {
    const sender = from;
    const DEFAULT_FOOTER = `\n\n> 🧬 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴏᴠɪᴇʜᴜʙ-ᴅʟ`;
    const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500";

    if (!args.length) {
        await socket.sendMessage(sender, {
            text: `*❪ ERROR ❫*\n\n⚠️ *Invalid Usage!*\n\n🎬 *Example:*\n• .thenkiri avatar\n• .tk rrr\n\n📝 _Please provide the Movie name!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
        return;
    }

    const thenkiriQuery = args.join(' ');
    await socket.sendMessage(sender, { 
        text: `*❪ SEARCHING ❫*\n\n🔍 *Searching Thenkiri...*\n⚡ _Please wait a moment._`
    });

    try {
        // 1️⃣ Find Search Function
        const searchFn = thenkiri.search || thenkiri.searchMovie || thenkiri.getSearch || thenkiri;
        
        if (typeof searchFn !== 'function') {
            throw new Error("Scraper search function not found!");
        }

        const searchResults = await searchFn(thenkiriQuery);

        if (!searchResults || searchResults.length === 0) {
            await socket.sendMessage(sender, {
                text: `*❪ NO RESULTS ❫*\n\n😞 *No Results Found!*\n\n🎬 *Query:* _${thenkiriQuery}_\n💡 *Tip:* _Please check the spelling and try again!_${DEFAULT_FOOTER}`
            }, { quoted: msg });
            return;
        }

        const tkResults = searchResults.slice(0, 25);
        let listText = `*❪ SEARCH RESULTS ❫*\n\n🎯 *Query:* _${thenkiriQuery}_\n📊 *Results:* _${tkResults.length} Items_\n\n*👇 SELECT A NUMBER 👇*\n\n`;

        tkResults.forEach((item, index) => {
            const num = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
            const title = item.title || item.name || "Movie";
            listText += `*${num}* ➜ 🎥 _${title.substring(0, 40)}_\n`;
        });

        listText += `${DEFAULT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, { text: listText }, { quoted: msg });
        const messageID = sentMsg.key.id;

        // Selection Listener
        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToSentMsg && sender === replyMek.key.remoteJid) {
                const choice = parseInt(messageType) - 1;
                if (isNaN(choice) || choice < 0 || choice >= tkResults.length) {
                    await socket.sendMessage(sender, {
                        text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Number!*\n🎯 *Range:* _01 - ${tkResults.length}_\n📝 _Please reply with a valid number!_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    return;
                }

                const selectedItem = tkResults[choice];

                await socket.sendMessage(sender, { 
                    text: `*❪ FETCHING ❫*\n\n🎬 *Fetching Movie Details...*\n⚡ _Please wait..._`
                }, { quoted: replyMek });

                try {
                    // 2️⃣ Safe Get Details/Links Function Matching
                    let getLinksFn = thenkiri.getLinks || thenkiri.getDl || thenkiri.download || thenkiri.info || thenkiri.getMovie;

                    if (typeof getLinksFn !== 'function') {
                        // Fallback: search for any function inside package if not matched above
                        const availableFns = Object.keys(thenkiri).filter(k => typeof thenkiri[k] === 'function');
                        if (availableFns.length > 1) {
                            const dlFnName = availableFns.find(fn => fn !== 'search' && fn !== 'searchMovie');
                            if (dlFnName) getLinksFn = thenkiri[dlFnName];
                        }
                    }

                    if (typeof getLinksFn !== 'function') {
                        throw new Error("Download links function not found in scraper package!");
                    }

                    const itemLink = selectedItem.link || selectedItem.url;
                    const movieData = await getLinksFn(itemLink);
                    
                    // Handle array or object return format
                    const validDownloads = movieData?.links || movieData?.download || (Array.isArray(movieData) ? movieData : []);

                    if (!validDownloads || validDownloads.length === 0) {
                        await socket.sendMessage(sender, {
                            text: `*❪ NO DOWNLOADS ❫*\n\n⚠️ *No Downloads Found!*\n😞 _There are no downloads available for this movie!_${DEFAULT_FOOTER}`
                        }, { quoted: replyMek });
                        return;
                    }

                    // Movie Details Text
                    const itemTitle = selectedItem.title || selectedItem.name || "Movie";
                    const movieDetailsText = `*❪ MOVIE DETAILS ❫*\n\n🎬 *Title:* ${itemTitle}\n🗿 *Source:* thenkiri.com${DEFAULT_FOOTER}`;
                    const moviePosterUrl = selectedItem.img || selectedItem.image || selectedItem.poster || DEFAULT_IMAGE;

                    // Send Poster Image
                    await socket.sendMessage(sender, {
                        image: { url: moviePosterUrl },
                        caption: movieDetailsText
                    }, { quoted: replyMek });

                    // Download Options Text
                    const downloadOptionsText = `*❪ DOWNLOADS ❫*\n\n📥 *Select Quality / Option:*\n\n${validDownloads.map((dl, i) => {
                        const num = (i + 1) < 10 ? `0${i + 1}` : `${i + 1}`;
                        const label = dl.quality || dl.title || dl.label || "Direct Link";
                        const size = dl.size ? `💾 _${dl.size}_` : '';
                        return `*${num}* ➜ 🎥 _${label}_ ${size}`;
                    }).join('\n')}\n\n*💬 REPLY TO DOWNLOAD 💬*\n📌 _Reply with the number_${DEFAULT_FOOTER}`;

                    const downloadOptionsMsg = await socket.sendMessage(sender, { text: downloadOptionsText }, { quoted: replyMek });
                    const optionsMsgID = downloadOptionsMsg.key.id;

                    // Download Listener
                    const handleDownload = async ({ messages: downloadMessages }) => {
                        const downloadMek = downloadMessages[0];
                        if (!downloadMek?.message) return;

                        const downloadChoice = downloadMek.message.conversation || downloadMek.message.extendedTextMessage?.text;
                        const isReplyToOptionsMsg = downloadMek.message.extendedTextMessage?.contextInfo?.stanzaId === optionsMsgID;

                        if (isReplyToOptionsMsg && sender === downloadMek.key.remoteJid) {
                            const choiceNum = parseInt(downloadChoice) - 1;
                            
                            if (isNaN(choiceNum) || choiceNum < 0 || choiceNum >= validDownloads.length) {
                                await socket.sendMessage(sender, {
                                    text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Number!*\n🎯 *Range:* _01 - ${validDownloads.length}_\n📝 _Please reply with a valid number!_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                                return;
                            }

                            const selectedDownload = validDownloads[choiceNum];
                            await socket.sendMessage(sender, { react: { text: '📥', key: downloadMek.key } });

                            try {
                                const finalDirectLink = selectedDownload.link || selectedDownload.url;
                                const qualityLabel = selectedDownload.quality || selectedDownload.title || 'HD';
                                const safeFileName = `${itemTitle.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

                                await socket.sendMessage(sender, {
                                    document: { url: finalDirectLink },
                                    mimetype: 'video/mp4',
                                    fileName: safeFileName,
                                    caption: `*❪ MOVIE ❫*\n\n🎭 *${itemTitle}*\n📌 *Quality:* _${qualityLabel}_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });

                                await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });

                            } catch (downloadError) {
                                console.error('Download error:', downloadError);
                                await socket.sendMessage(sender, {
                                    text: `*❪ ERROR ❫*\n\n❌ *Download Failed!*\n🚫 _${downloadError.message || 'Unable to fetch file'}_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                            } finally {
                                socket.ev.off('messages.upsert', handleDownload);
                                socket.ev.off('messages.upsert', handleSelection);
                            }
                        }
                    };

                    socket.ev.on('messages.upsert', handleDownload);

                } catch (detailsError) {
                    console.error('Details error:', detailsError);
                    await socket.sendMessage(sender, {
                        text: `*❪ ERROR ❫*\n\n❌ *Movie Details Error!*\n🚫 _${detailsError.message}_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    socket.ev.off('messages.upsert', handleSelection);
                }
            }
        };

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('Thenkiri command error:', error);
        await socket.sendMessage(sender, {
            text: `*❪ SYSTEM ERROR ❫*\n\n❌ *System Error!*\n🚫 _${error.message || 'Unknown error'}_\n\n🔄 _Please try again later..._${DEFAULT_FOOTER}`
        }, { quoted: msg });
    }
});
