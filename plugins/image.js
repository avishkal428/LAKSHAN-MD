const axios = require('axios');
const g_i_s = require('g-i-s');
const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, downloadContentFromMessage, areJidsSameUser, getContentType } = require('@whiskeysockets/baileys')
const { cmd, commands } = require('../command')

cmd({
    pattern: "imagesearch",
    alias: ["img", "image", "pic", "googleimg"],
    react: "🔍",
    desc: "Search and download images from Google",
    category: "download",
    use: '.imagesearch <query>',
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return reply(`Please provide a search query! Example: .imagesearch nature`);
        
        // Inform user that search is in progress
        await reply(`🔍 Searching for "${q}" images from Google...`);
        
        // Call Google image search function
        await searchGoogleArray(q, conn, mek, m, pushname, from);
        
    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});

// Function to search Google images and display as array
async function searchGoogleArray(query, conn, mek, m, pushname, from) {
    try {
        // Create a promise for g_i_s to handle the callback
        const getImages = () => {
            return new Promise((resolve, reject) => {
                g_i_s(query, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
            });
        };
        
        // Get images
        const result = await getImages();
        
        if (!result || !result.length) {
            await conn.sendMessage(from, { text: "No Google images found for your query!" }, { quoted: mek });
            return;
        }

        // Create image function for carousel
        async function createImage(url) {
            const { imageMessage } = await generateWAMessageContent({
                image: {
                    url
                }
            }, {
                upload: conn.waUploadToServer
            });
            return imageMessage;
        }
        
        // Function to shuffle array
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        
        // Prepare images array
        let imageResults = result.map(img => img.url);
        shuffleArray(imageResults);
        
        // Limit to 10 images
        let selectedImages = imageResults.slice(0, 10);
        
        // Prepare array for carousel
        let push = [];
        let i = 1;
        
        for (let imageUrl of selectedImages) {
            try {
                push.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `Image - ${i++}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: '> *© ❄️Frozen-queen❄️ by mr chathura*'
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: 'Hello ' + pushname,
                        hasMediaAttachment: true,
                        imageMessage: await createImage(imageUrl)
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: []
                    })
                });
            } catch (imgError) {
                console.log('Failed to process image:', imageUrl, imgError);
            }
        }
        
        // Check if we have any valid images
        if (push.length === 0) {
            await conn.sendMessage(from, { text: "Failed to process any images for your query!" }, { quoted: mek });
            return;
        }
        
        // Create and send carousel message
        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: '🔎 Google Images for: ' + query
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: '> *© ❄️Frozen-queen❄️ by mr chathura*'
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: false
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: [...push]
                        })
                    })
                }
            }
        }, {});
        
        await conn.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id
        });
        
    } catch (err) {
        console.error('Google search array error:', err);
        conn.sendMessage(from, { text: "Error searching Google images!" }, { quoted: mek });
    }
}

// Add a separate command for Google search as an alias
cmd({
    pattern: "googleimg",
    alias: ["gimg"],
    react: "🔍",
    desc: "Search and download images from Google",
    category: "download",
    use: '.googleimg <query>',
    filename: __filename
},
async(conn, mek, m, { from, q, pushname, reply }) => {
    try {
        if (!q) return reply(`Please provide a search query! Example: .googleimg nature`);
        await searchGoogleArray(q, conn, mek, m, pushname, from);
    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});
