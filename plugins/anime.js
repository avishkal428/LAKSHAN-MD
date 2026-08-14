const { cmd } = require('../command');
const scraper = require('liyanaarachchi-animeheavenme');

cmd({
    pattern: "anime",
    alias: ["animeheaven", "ah"],
    desc: "Search and download episodes from AnimeHeaven",
    category: "download",
    react: "🎥",
},
async (socket, msg, m, { from, args }) => {
    const sender = from;
    const DEFAULT_FOOTER = `\n\n> 🧬 ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴏᴠɪᴇʜᴜʙ-ᴅʟ`;

    if (!args.length) {
        await socket.sendMessage(sender, {
            text: `*❪ ERROR ❫*\n\n⚠️ *Invalid Usage!*\n\n🎬 *Example:*
• .anime dandadan
• .anime naruto\n\n📝 _Please provide the Anime name!_${DEFAULT_FOOTER}`
        }, { quoted: msg });
        return;
    }

    const query = args.join(' ');
    await socket.sendMessage(sender, { 
        text: `*❪ SEARCHING ❫*\n\n🔍 *Searching AnimeHeaven...*\n⚡ _Please wait a moment._`
    });

    try {
        // 1️⃣ Search Anime
        const searchResults = await scraper.searchAnime(query);

        if (!searchResults || searchResults.length === 0) {
            await socket.sendMessage(sender, {
                text: `*❪ NO RESULTS ❫*\n\n😞 *No Results Found!*\n\n🎬 *Query:* _${query}_\n💡 *Tip:* _Please check the spelling and try again!_${DEFAULT_FOOTER}`
            }, { quoted: msg });
            return;
        }

        const results = searchResults.slice(0, 20);
        let listText = `*❪ SEARCH RESULTS ❫*\n\n🎯 *Query:* _${query}_\n📊 *Results:* _${results.length} Items_\n\n*👇 SELECT A NUMBER 👇*\n\n`;

        results.forEach((item, index) => {
            const num = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
            listText += `*${num}* ➜ 📺 _${item.title.substring(0, 35)}_\n`;
        });

        listText += `${DEFAULT_FOOTER}`;
        
        const sentMsg = await socket.sendMessage(sender, { text: listText }, { quoted: msg });
        const messageID = sentMsg.key.id;

        // Selection Event Listener
        const handleSelection = async ({ messages: replyMessages }) => {
            const replyMek = replyMessages[0];
            if (!replyMek?.message) return;

            const messageType = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;
            const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToSentMsg && sender === replyMek.key.remoteJid) {
                const choice = parseInt(messageType) - 1;
                if (choice < 0 || choice >= results.length || isNaN(choice)) {
                    await socket.sendMessage(sender, {
                        text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Number!*\n🎯 *Range:* _01 - ${results.length}_\n📝 _Please reply with a valid number!_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    return;
                }

                const selectedAnime = results[choice];
                
                await socket.sendMessage(sender, { 
                    text: `*❪ FETCHING ❫*\n\n📺 *Fetching Episodes for ${selectedAnime.title}...*\n⚡ _Please wait..._`
                }, { quoted: replyMek });

                try {
                    // 2️⃣ Get Episodes
                    const episodes = await scraper.getEpisodes(selectedAnime.link);

                    if (!episodes || episodes.length === 0) {
                        await socket.sendMessage(sender, {
                            text: `*❪ NO EPISODES ❫*\n\n⚠️ *No Episodes Found!*\n😞 _There are no episodes available for this anime!_${DEFAULT_FOOTER}`
                        }, { quoted: replyMek });
                        return;
                    }

                    const validEpisodes = episodes.slice(0, 30); // 30 episodes දක්වා පෙන්වීමට

                    const downloadOptionsText = `*❪ EPISODES ❫*\n\n🎬 *Anime:* _${selectedAnime.title}_\n\n📥 *Select an Episode:*\n\n${validEpisodes.map((ep, i) => {
                        const num = (i + 1) < 10 ? `0${i + 1}` : `${i + 1}`;
                        return `*${num}* ➜ 💾 _${ep.name}_`;
                    }).join('\n')}\n\n*💬 REPLY TO DOWNLOAD 💬*\n📌 _Reply with the number_${DEFAULT_FOOTER}`;

                    const downloadOptionsMsg = await socket.sendMessage(sender, { text: downloadOptionsText }, { quoted: replyMek });
                    const optionsMsgID = downloadOptionsMsg.key.id;

                    // Episode Download Event Listener
                    const handleDownload = async ({ messages: downloadMessages }) => {
                        const downloadMek = downloadMessages[0];
                        if (!downloadMek?.message) return;

                        const downloadChoice = downloadMek.message.conversation || downloadMek.message.extendedTextMessage?.text;
                        const isReplyToOptionsMsg = downloadMek.message.extendedTextMessage?.contextInfo?.stanzaId === optionsMsgID;

                        if (isReplyToOptionsMsg && sender === downloadMek.key.remoteJid) {
                            const choiceNum = parseInt(downloadChoice) - 1;
                            
                            if (isNaN(choiceNum) || choiceNum < 0 || choiceNum >= validEpisodes.length) {
                                await socket.sendMessage(sender, {
                                    text: `*❪ INVALID ❫*\n\n⚠️ *Wrong Number!*\n🎯 *Range:* _01 - ${validEpisodes.length}_\n📝 _Please reply with a valid number!_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });
                                return;
                            }

                            const selectedEp = validEpisodes[choiceNum];
                            await socket.sendMessage(sender, { react: { text: '📥', key: downloadMek.key } });

                            try {
                                // 3️⃣ Get Direct Video Link
                                const videoLink = await scraper.getVideoLink(selectedEp.id, selectedAnime.link);

                                if (!videoLink) {
                                    throw new Error("Direct link could not be generated.");
                                }

                                // Send Document (Video)
                                await socket.sendMessage(sender, {
                                    document: { url: videoLink },
                                    mimetype: 'video/mp4',
                                    fileName: `${selectedAnime.title} - ${selectedEp.name}.mp4`,
                                    caption: `*❪ ANIME HEAVEN ❫*\n\n🎭 *${selectedAnime.title}*\n📌 *Episode:* _${selectedEp.name}_${DEFAULT_FOOTER}`
                                }, { quoted: downloadMek });

                                await socket.sendMessage(sender, { react: { text: '✅', key: downloadMek.key } });

                            } catch (downloadError) {
                                console.error('Download link error:', downloadError);
                                await socket.sendMessage(sender, {
                                    text: `*❪ ERROR ❫*\n\n❌ *Download Failed!*\n🚫 _${downloadError.message || 'Unable to fetch direct link.'}_${DEFAULT_FOOTER}`
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
                        text: `*❪ ERROR ❫*\n\n❌ *Anime Details Error!*\n🚫 _${detailsError.message}_${DEFAULT_FOOTER}`
                    }, { quoted: replyMek });
                    socket.ev.off('messages.upsert', handleSelection);
                }
            }
        };

        socket.ev.on('messages.upsert', handleSelection);

    } catch (error) {
        console.error('Anime command error:', error);
        await socket.sendMessage(sender, {
            text: `*❪ SYSTEM ERROR ❫*\n\n❌ *System Error!*\n🚫 _${error.message || 'Unknown error'}_${DEFAULT_FOOTER}`
        }, { quoted: msg });
    }
});
