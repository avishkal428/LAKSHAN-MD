const { cmd } = require("../command");
const { generateForwardMessageContent, generateWAMessageFromContent } = require("@whiskeysockets/baileys");

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

      // Quoted message එක Baileys Forwarding content එකක් බවට පත්කිරීම
      const forwardContent = await generateForwardMessageContent(
        {
          key: {
            remoteJid: from,
            id: ctx.stanzaId,
            participant: ctx.participant,
          },
          message: ctx.quotedMessage,
        },
        { forceForward: true }
      );

      // New WA Message එකක් Generate කිරීම
      const waMessage = await generateWAMessageFromContent(
        targetJid,
        forwardContent,
        {
          userJid: bot.user.id,
        }
      );

      // Relay Message හරහා Target Chat එකට Send කිරීම
      await bot.relayMessage(targetJid, waMessage.message, {
        messageId: waMessage.key.id,
      });

      await reply(`✅ Forwarded successfully to ${targetJid}`);
    } catch (e) {
      console.log("FORWARD ERROR:", e);
      reply("❌ Forward failed: " + e.message);
    }
  }
);
