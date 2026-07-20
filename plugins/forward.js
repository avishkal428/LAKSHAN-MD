const { cmd } = require("../command");

cmd(
  {
    pattern: "forward",
    alias: ["fo"],
    react: "📌",
    desc: "Forward the replied message to another chat",
    category: "tools",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      const ctx = mek.message?.extendedTextMessage?.contextInfo;
      if (!ctx || !ctx.quotedMessage) return reply("↩️ Reply to the message you want to forward, then run:\n.fo <jid>");
      if (!q) return reply("📌 Give me a target chat.\nPerson: .fo 94771234567@s.whatsapp.net\nGroup: .fo 120363012345678901@g.us");

      const targetJid = q.trim();

      // Forwarded tag එක සහ context info එක සකස් කිරීම
      const messageToForward = {
        ...ctx.quotedMessage,
      };

      // Message type එක සොයාගැනීම (text, image, video, document etc.)
      const messageType = Object.keys(messageToForward)[0];

      if (messageType && messageToForward[messageType]) {
        messageToForward[messageType].contextInfo = {
          ...(messageToForward[messageType].contextInfo || {}),
          isForwarded: true,
          forwardingScore: 1
        };
      }

      await bot.relayMessage(targetJid, messageToForward, {
        messageId: mek.key.id
      });

      await reply(`✅ Forwarded successfully to ${targetJid}`);
    } catch (e) {
      console.log("FORWARD ERROR:", e);
      reply("❌ Forward failed: " + e.message);
    }
  }
);
