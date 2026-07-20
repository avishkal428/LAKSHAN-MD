const { cmd } = require("../command");
const { copyNForward } = require("../lib/functions");

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

      const quotedKey = {
        remoteJid: from,
        id: ctx.stanzaId,
        participant: ctx.participant || from,
      };

      const quotedFull = {
        key: quotedKey,
        message: ctx.quotedMessage,
      };

      await copyNForward(bot, targetJid, quotedFull, true);
      await reply(`✅ Forwarded successfully to ${targetJid}`);
    } catch (e) {
      console.log("FORWARD ERROR:", e);
      reply("❌ Forward failed: " + e.message);
    }
  }
);
