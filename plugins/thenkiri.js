const { cmd } = require('../command');
const scraper = require('liyanaarachchi-thenkiri-scrap');

cmd({
    pattern: "thenkiri",
    alias: ["tk", "thenkiridl"],
    desc: "Search and download movies from Thenkiri",
    category: "download",
    react: "🎥",
},
async (socket, msg, m, { from, args }) => {
    const sender = from;
    const DEFAULT_FOOTER = `\n\n> 🧬 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋𝐀𝐊𝐒𝐇𝐀𝐍-𝐌𝐃`;
    const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500";

    if (!args.length) {
        await socket.sendMessage(sender, {
            text: `*❪ ERROR ❫*\n\n⚠️ *Invalid Usage!*\n\n🎬 *Example:*\n• .thenkiri deadpool\n• .tk rrr\n\n📝 _Please provide the Movie name!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
        return;
    }

    const thenkiriQuery = args.join(' ');
    await socket.sendMessage(sender, { 
        text: `*❪ SEARCHING ❫*\n\n🔍 *Searching Thenkiri...*\n⚡ _Please wait a moment._`
    });

    try {
        // 1️⃣ Search Movie
        const searchResults = await scraper.searchMovie(thenkiriQuery);

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
            listText += `*${num}* ➜ 🎥 _${title.substring(0, 50)}_\n`;
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
                    text: `*❪ FETCHING ❫*\n\n🎬 *Fetching Download Options...*\n⚡ _Please wait..._`
                }, { quoted: replyMek });

                try {
                    // 2️⃣ Get Download Options
                    const options = await scraper.getDownloadOptions(selectedItem.link);

                    if (!options || options.length === 0) {
                        await socket.sendMessage(sender, {
                            text: `*❪ NO DOWNLOADS ❫*\n\n⚠️ *No Download Links Found!*\n😞 _There are no direct links available for this movie!_${DEFAULT_FOOTER}`
                        }, { quoted: replyMek });
                        return;
                    }

                    // Movie Details & Poster Photo
                    const moviePosterUrl = selectedItem.img || selectedItem.image || selectedItem.poster || DEFAULT_IMAGE;
                    const movieDetailsText = `*❪ MOVIE DETAILS ❫*\n\n🎬 *Title:* ${selectedItem.title}\n🗿 *Source:* thenkiri.com${DEFAULT_FOOTER}`;

                    await socket.sendMessage(sender, {
                        image: { url: moviePosterUrl },
                        caption: movieDetailsText
                    }, { quoted: replyMek });

                    // 🛠️ Quality සහ Size පෙනෙන සේ සැකසූ Download Menu එක:
                    let downloadOptionsText = `*❪ DOWNLOADS ❫*\n\n📥 *Select Quality / Option:*\n\n`;

                    options.forEach((opt, i) => {
                        const num = (i + 1) < 10 ? `0${i + 1}` : `${i + 1}`;
                        // Quality එක සහ Size එක වෙන්කර ගැනීම
                        const quality = opt.quality || opt.name || opt.title || 'HD';
                        const size = opt.size ? ` 💾 [_${opt.size}_]` : '';

                        downloadOptionsText += `*${num}* ➜ 🎥 *${quality}*${size}\n`;
                    });

                    downloadOptionsText += `\n*💬 REPLY TO DOWNLOAD 💬*\n📌 _Reply with the number_${DEFAULT_FOOTER}`;

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
                            
                            if (isNaN(choiceNum) || choiceNum < 0 || choiceNum >= options.length) {
                                await socket.sendMessage(sender, {
                                    text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Number!*\n🎯 *Range:* _01 - ${options.length}_\n📝 _Please reply with a valid number!_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                                return;
                            }

                            const selectedOption = options[choiceNum];
                            const selectedQuality = selectedOption.quality || selectedOption.name || 'HD';
                            const selectedSize = selectedOption.size ? ` | 💾 ${selectedOption.size}` : '';

                            await socket.sendMessage(sender, { react: { text: '⏳', key: downloadMek.key } });

                            try {
                                // 3️⃣ Get Direct Video Link (Auto Bypass)
                                const finalDirectLink = await scraper.bypassDownloadwella(selectedOption.link);

                                if (!finalDirectLink) {
                                    throw new Error("Direct link could not be generated.");
                                }

                                await socket.sendMessage(sender, { react: { text: '📥', key: downloadMek.key } });

                                const safeFileName = `${selectedItem.title.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

                                try {
                                    // Direct File Download Attempt
                                    await socket.sendMessage(sender, {
                                        document: { url: finalDirectLink },
                                        mimetype: 'video/mp4',
                                        fileName: safeFileName,
                                        caption: `*❪ THENKIRI ❫*\n\n🎭 *${selectedItem.title}*\n📌 *Quality:* _${selectedQuality}_${selectedSize}${DEFAULT_FOOTER}`
                                    }, { quoted: downloadMek });

                                    await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });

                                } catch (fileSendErr) {
                                    // If File size is too large, send Direct Download Link Text
                                    await socket.sendMessage(sender, {
                                        text: `*❪ DIRECT DOWNLOAD LINK ❫*\n\n🎬 *Title:* ${selectedItem.title}\n📌 *Quality:* ${selectedQuality}${selectedSize}\n\n🔗 *Download Link:* \n${finalDirectLink}\n\n💡 _File එක විශාල වැඩි නිසා Bot ට Send කිරීමට නොහැක. ඉහත Link එක ක්ලික් කර Browser එකෙන් Download කරගන්න!_${DEFAULT_FOOTER}`
                                    }, { quoted: downloadMek });

                                    await socket.sendMessage(sender, { react: { text: '🔗', key: downloadMek.key } });
                                }

                            } catch (downloadError) {
                                console.error('Bypass error:', downloadError);
                                await socket.sendMessage(sender, {
                                    text: `*❪ ERROR ❫*\n\n❌ *Download Failed!*\n🚫 _${downloadError.message || 'Unable to fetch bypass link'}_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                            } finally {
                                socket.ev.off('messages.upsert', handleDownload);
                                socket.ev.off('messages.upsert', handleSelection);
                            }
                        }
                    };

                    socket.ev.on('messages.upsert', handleDownload);

                } catch (detailsError) {
                    console.error('Options error:', detailsError);
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
