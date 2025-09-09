const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");

cmd({
    pattern: "system",
    alias: ["status", "botinfo"],
    desc: "Check up time , ram usage and more",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        let status = `*Uptime:* ${runtime(process.uptime())}\n*Ram usage:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB\n*HostName:* ${os.hostname()}\n*owner:* LIYANAARACHCHI AVISHKA THIMIRA LAKSHAN`;
        return reply(status);
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
