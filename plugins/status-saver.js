const { cmd } = require("../command");

cmd({
  pattern: "send",
  alias: ["sendme", 'save'],
  react: '📤',
  desc: "Forwards quoted message back to user",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {
    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a message!*"
      }, { quoted: message });
    }

    // Quoted message එකෙහි මුල් message type එක ලබා ගැනීම
    const quotedMsg = match.quoted.message || match.quoted;
    const mtype = match.quoted.mtype || Object.keys(quotedMsg)[0];

    const buffer = await match.quoted.download();
    const options = { quoted: message };

    let messageContent = {};

    if (mtype.includes("image") || mtype === "imageMessage") {
      messageContent = {
        image: buffer,
        caption: match.quoted.text || match.quoted.caption || '',
        mimetype: match.quoted.mimetype || "image/jpeg"
      };
    } else if (mtype.includes("video") || mtype === "videoMessage") {
      messageContent = {
        video: buffer,
        caption: match.quoted.text || match.quoted.caption || '',
        mimetype: match.quoted.mimetype || "video/mp4"
      };
    } else if (mtype.includes("audio") || mtype === "audioMessage") {
      messageContent = {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: match.quoted.ptt || false
      };
    } else {
      return await client.sendMessage(from, {
        text: "❌ Only image, video, and audio messages are supported"
      }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("Forward Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error forwarding message:\n" + error.message
    }, { quoted: message });
  }
});
