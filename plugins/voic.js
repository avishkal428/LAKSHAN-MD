const googleTTS = require("google-tts-api");

// Path Error එක වැළැක්වීම සඳහා Safe Import එකක්
let Module_Exports, prefix;
try {
  const lib = require("../lib");
  Module_Exports = lib.Module_Exports;
  prefix = lib.prefix || ".";
} catch (e) {
  try {
    const libIndex = require("../lib/index");
    Module_Exports = libIndex.Module_Exports;
    prefix = libIndex.prefix || ".";
  } catch (err) {
    console.error("Lib folder search error:", err);
  }
}

Module_Exports(
  {
    kingcmd: "tts",
    infocmd: "Converts provided text into spoken audio.",
    kingclass: "downloader",
    kingpath: __filename,
    use: "Hello world",
  },
  async (sigma, person, memo) => {
    try {
      if (!memo) {
        return await person.reply(
          `_කරුණාකර හඬ බවට හැරවීමට අවශ්‍ය Text එක ලබාදෙන්න._\n\n*උදාහරණ:* ${prefix}tts Hello, how are you?`
        );
      }

      await person.reply("*_Converting Your Text To Voice..._*");

      const ttsurl = googleTTS.getAudioUrl(memo, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
      });

      return await sigma.sendMessage(
        person.chat,
        {
          audio: { url: ttsurl },
          mimetype: "audio/mpeg",
          fileName: "tts_audio.mp3",
        },
        { quoted: person }
      );
    } catch (error) {
      console.error("TTS Command Error:", error);
      return await person.reply(`_දෝෂයක් සිදු විය: ${error.message}_`);
    }
  }
);
