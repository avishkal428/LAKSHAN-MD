const { cmd } = require("../command");

cmd(
  {
    pattern: "forward",
    alias: ["fo"],
    react: "📌",
    desc: "Forward replied message to target JID",
    category: "tools",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      // 1. Check if user replied to a message
      const ctx = mek.message?.extendedTextMessage?.contextInfo;
      if (!ctx || !ctx.quotedMessage) {
        return reply("↩️ Reply to the message you want to forward, then run:\n.fo <jid>");
      }

      // 2. Check if target JID is provided
      if (!q) {
        return reply("📌 Give me a target chat JID.\nPerson: .fo 94771234567@s.whatsapp.net\nGroup: .fo 120363012345678901@g.us");
      }

      const targetJid = q.trim();

      // 3. Extract quoted message properly
      const quotedMsg = ctx.quotedMessage;

      // 4. Direct Forwarding method (100% Native Baileys method)
      await bot.sendMessage(
        targetJid,
        {
          forward: {
            key: {
              remoteJid: from,
              id: ctx.stanzaId,
              participant: ctx.participant || from,
              fromMe: false
            },
            message: quotedMsg
          }
        }
      );

      await reply(`✅ Forwarded successfully to ${targetJid}`);
    } catch (e) {
      console.log("FORWARD ERROR:", e);
      reply("❌ Forward failed: " + e.message);
    }
  }
);
