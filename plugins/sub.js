const { cmd } = require('../command');
const scraper = require('liyanaarachchi-sinhalasub-scraper-v2');

cmd({
    pattern: "sinhalasub",
    alias: ["ssub"],
    desc: "Search and download movies or TV shows from SinhalaSub",
    category: "download",
    react: "🎥",
},
async (socket, msg, m, { from, args }) => {
    const sender = from;
    const DEFAULT_FOOTER = `\n\n> 🧬 ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐋𝐀𝐊𝐒𝐇𝐀𝐌-𝐌𝐃`;
    const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500";

    if (!args.length) {
        await socket.sendMessage(sender, {
            text: `*❪ ERROR ❫*\n\n⚠️ *Invalid Usage!*\n\n🎬 *Example:*\n• .sinhalasub avatar\n• .ssub breaking bad\n\n📝 _Please provide the Movie or TV Series name!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
        return;
    }

    const query = args.join(' ');
    await socket.sendMessage(sender, { 
        text: `*❪ SEARCHING ❫*\n\n🔍 *Searching Sinhalasub...*\n⚡ _Please wait a moment._`
    });

    try {
        // Search using NPM Package scraper
        const rawResults = await scraper.searchSinhalaSub(query);

        if (!rawResults || rawResults.length === 0) {
            await socket.sendMessage(sender, {
                text: `*❪ NO RESULTS ❫*\n\n😞 *No Results Found!*\n\n🎬 *Query:* _${query}_\n💡 *Tip:* _Please check the spelling and try again!_${DEFAULT_FOOTER}`
            }, { quoted: msg });
            return;
        }

        const results = rawResults.slice(0, 25);
        let listText = `*❪ SEARCH RESULTS ❫*\n\n🎯 *Query:* _${query}_\n📊 *Results:* _${results.length} Items_\n\n*👇 SELECT A NUMBER 👇*\n\n`;

        results.forEach((item, index) => {
            const num = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
            listText += `*${num}* ➜ 🎥 _${item.title.substring(0, 100)}_\n`;
        });

        listText += `${DEFAULT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, { text: listText }, { quoted: msg });
        const messageID = sentMsg.key.id;

        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToSentMsg && sender === replyMek.key.remoteJid) {
                const choice = parseInt(messageType) - 1;
                if (isNaN(choice) || choice < 0 || choice >= results.length) {
                    await socket.sendMessage(sender, {
                        text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Number!*\n🎯 *Range:* _01 - ${results.length}_\n📝 _Please reply with a valid number!_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    return;
                }

                const selectedItem = results[choice];

                await socket.sendMessage(sender, { 
                    text: `*❪ FETCHING ❫*\n\n🎬 *Fetching Details & Links...*\n⚡ _Please wait..._`
                }, { quoted: replyMek });

                try {
                    // Fetch direct download links via scraper npm
                    const downloadLinks = await scraper.getMovieLinks(selectedItem.link);

                    if (!downloadLinks || downloadLinks.length === 0) {
                        await socket.sendMessage(sender, {
                            text: `*❪ NO DOWNLOADS ❫*\n\n⚠️ *No Downloads Found!*\n😞 _There are no direct links available for this title!_${DEFAULT_FOOTER}`
                        }, { quoted: replyMek });
                        socket.ev.off('messages.upsert', handleSelection);
                        return;
                    }

                    // Prioritize Pixeldrain links
                    const pixeldrainLinks = downloadLinks.filter(dl => dl.link && dl.link.toLowerCase().includes("pixeldrain"));
                    const validDownloads = pixeldrainLinks.length > 0 ? pixeldrainLinks : downloadLinks;

                    // Display details card with poster
                    const movieDetailsText = `*❪ MOVIE / SHOW DETAILS ❫*\n\n🎬 *${selectedItem.title}*\n🗿 𝗪ᴇʙ ➜ sinhalasub.lk\n${DEFAULT_FOOTER}`;
                    const posterUrl = selectedItem.img || DEFAULT_IMAGE;

                    await socket.sendMessage(sender, {
                        image: { url: posterUrl },
                        caption: movieDetailsText
                    }, { quoted: replyMek });

                    // Format available quality / download options
                    const downloadOptionsText = `*❪ DOWNLOADS ❫*\n\n📥 *Select Quality / Option:*\n\n${validDownloads.map((dl, i) => {
                        const num = (i + 1) < 10 ? `0${i + 1}` : `${i + 1}`;
                        const label = dl.label || "Direct Link";
                        const qualityIcon = label.includes('1080') ? '🔥' : label.includes('720') ? '💎' : '📱';
                        return `*${num}* ➜ ${qualityIcon} _${label}_`;
                    }).join('\n')}\n\n*💬 REPLY TO DOWNLOAD 💬*\n📌 _Reply with the number_${DEFAULT_FOOTER}`;

                    const downloadOptionsMsg = await socket.sendMessage(sender, { text: downloadOptionsText }, { quoted: replyMek });
                    const optionsMsgID = downloadOptionsMsg.key.id;

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
                                let directUrl = selectedDownload.link;
                                
                                // Auto convert Pixeldrain standard link to Direct API Download link
                                const pdMatch = directUrl.match(/pixeldrain\.com\/(?:u|file)\/([a-zA-Z0-9]+)/i);
                                if (pdMatch && pdMatch[1]) {
                                    directUrl = `https://pixeldrain.com/api/file/${pdMatch[1]}?download`;
                                }

                                const safeFileName = `${selectedItem.title.replace(/[/\\?%*:|"<>]/g, "")}.mp4`;

                                await socket.sendMessage(sender, {
                                    document: { url: directUrl },
                                    mimetype: 'video/mp4',
                                    fileName: safeFileName,
                                    caption: `*❪ MOVIE / SHOW ❫*\n\n🎭 *${selectedItem.title}*\n📌 *Quality:* _${selectedDownload.label || 'HD'}_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });

                                await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });

                            } catch (downloadError) {
                                console.error('Download link error:', downloadError);
                                await socket.sendMessage(sender, { react: { text: '❌', key: downloadMek.key } });
                                await socket.sendMessage(sender, {
                                    text: `*❪ ERROR ❫*\n\n❌ *Download Failed!*\n🚫 _${downloadError.message}_${DEFAULT_FOOTER}`
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
                        text: `*❪ ERROR ❫*\n\n❌ *Error Fetching Details!*\n🚫 _${detailsError.message}_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    socket.ev.off('messages.upsert', handleSelection);
                }
            }
        };

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('Sinhalasub command error:', error);
        await socket.sendMessage(sender, {
            text: `*❪ SYSTEM ERROR ❫*\n\n❌ *System Error!*\n🚫 _${error.message || 'Unknown error'}_\n\n🔄 _Please try again later..._${DEFAULT_FOOTER}`
        }, { quoted: msg });
    }
});
