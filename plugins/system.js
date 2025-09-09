const config = require('../config');
const { cmd, commands } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "system",
    alias: ["status", "botinfo"],
    desc: "Check bot uptime, RAM usage, hostname, and more with a photo",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        // Bot photo URL or local path (ඔබේ bot photo එකේ URL එක මෙතන දාන්න)
        const botPhoto = 'https://i.imgur.com/your-bot-photo.jpg'; // ඔබේ bot photo එකේ URL එක මෙතන දාන්න

        // System status details
        const uptime = runtime(process.uptime());
        const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2); // MB එකට convert කරනවා
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2); // Total RAM MB එකට
        const hostname = os.hostname();
        const owner = "LIYANAARACHCHI AVISHKA THIMIRA LAKSHAN";

        // Format the status message
        const statusMessage = `
*🤖 Bot System Status 🤖*

*⏰ Uptime:* ${uptime}
*💾 RAM Usage:* ${ramUsage} MB / ${totalRam} MB
*🖥️ Hostname:* ${hostname}
*👑 Owner:* ${owner}

*Powered by xAI* 🚀
        `;

        // Send the message with the bot's photo
        await conn.sendMessage(from, {
            image: { url: botPhoto },
            caption: statusMessage,
        }, { quoted });

    } catch (e) {
        console.log(e);
        await reply("❌ යම් දෝෂයක් ඇති වුණා! කරුණාකර පසුව නැවත උත්සාහ කරන්න.");
    }
});
