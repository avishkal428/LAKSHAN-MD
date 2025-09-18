const config = require('../config')
const {cmd , commands} = require('../command')

cmd({
    pattern: "alive",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
return await conn.sendMessage(from,{image: {url: config.ALIVE_IMG},caption: config.ALIVE_MSG},{quoted: mek})
}catch(e){
console.log(e)
reply(`${e}`)
}
})//-------
        const config = await readEnv();
        if (!config) throw new Error("Missing configuration");

        const aliveText = 
🌟 *H𝗘𝗟𝗟𝗢, *${pushname}*!  
━━━━━━━━━━━━━━━━━━  
*╭─「 𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂 」*  
*│🧬 𝚂𝚃𝙰𝚃𝚄𝚂 -* Online  
*│🪼 𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴 -* ${formatRAMUsage()}  
*│⏰ 𝚁𝚄𝙽𝚃𝙸𝙼𝙴 -* ${formatRuntime()}  
*│🤖 𝙱𝙾𝚃 𝙽𝙰𝙼𝙴 -* ${config.BOT_NAME || 'LAKSHAN-MD'}  
*│👑 𝙾𝚆𝙽𝙴𝚁 -* ${config.OWNER_NAME || 'LIYANAARACHCHI AVISHKA THIMIRA LAKSHAN'}  
*╰──────────●●►*  
━━━━━━━━━━━━━━━━━━  
🔰 *I'M ALIVE AND READY!* 🔰  
  

*© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚀𝚄𝙴𝙴𝙽 𝙶𝙸𝙼𝙸*
;

        const imageUrl = config.MENU_IMAGE_URL || 'https://files.catbox.moe/lkvdvv.jpg';
        await conn.sendMessage(from, { 
            image: { url: imageUrl },
            caption: aliveText,
            contextInfo: {
                mentionedJid: [sender]
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        console.error("Alive Command Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(❌ *Failed to load bot status:* ${e.message || "Error!"});
    }
});
