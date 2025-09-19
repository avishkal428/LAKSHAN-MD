// Fetch download data using gifted.ytmp4
                const downloadData = await gifted.ytmp4(https://youtube.com/watch?v=${id}, quality);
                if (!downloadData?.success || !downloadData?.result?.download_url) {
                    await conn.sendMessage(from, { text: "❌ Download link not found!", edit: msg.key });
                    return;
                }
                const downloadUrl = downloadData.result.download_url;

                // Determine message type (video or document)
                if (userReply.startsWith("1.")) {
                    type = {
                        video: { url: downloadUrl },
                        mimetype: "video/mp4",
                        caption: ${title || "Unknown"}\nQuality: ${quality}p\n\n${config.FOOTER || "*© POWERED BY QUEEN GIMI*"}
                    };
                } else if (userReply.startsWith("2.")) {
                    type = {
                        document: { url: downloadUrl },
                        fileName: ${title || "video"}-${quality}p.mp4,
                        mimetype: "video/mp4",
                        caption: ${title || "Unknown"}\nQuality: ${quality}p\n\n${config.FOOTER || "*© POWERED BY QUEEN GIMI*"}
                    };
                }

                // Send the content to the user
                await conn.sendMessage(from, type, { quoted: mek });
                // Edit the "Downloading..." message to "Download Success"
                await conn.sendMessage(from, { text: '✅ Download Success ✅', edit: msg.key });

            } catch (error) {
                console.error(error);
                await conn.sendMessage(from, { text: ❌ *An error occurred:* ${error.message || "Error!"}, edit: msg.key });
            }
        });

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(❌ *An error occurred:* ${error.message || "Error!"});
    }
});
