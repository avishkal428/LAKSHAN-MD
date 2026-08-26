const { exec } = require('child_process');

module.exports = {
    name: 'cinesubz',
    alias: ['cs', 'movie'],
    desc: 'Get Cinesubz Movie Download Links',
    category: 'download',
    async execute(m, { conn, args }) {
        if (!args[0]) return m.reply('❌ කරුණාකර Cinesubz Movie Link එක ලබා දෙන්න!\n\nඋදා: `.cinesubz https://cinesubz.lk/movies/m-r-p-neekentha-naakentha-2026-sinhala-subtitles/`');

        const movieUrl = args[0];
        await m.reply('⏳ Movie Links සෙවීම ආරම්භ කළා, මඳ වෙලාවක් රැඳී සිටින්න...');

        exec(`python3 scraper.py "${movieUrl}"`, (error, stdout, stderr) => {
            if (error || !stdout) {
                return m.reply('✘ Link එක extract කිරීමේදී Error එකක් ආවා.');
            }
            conn.sendMessage(m.chat, { text: stdout.trim() }, { quoted: m });
        });
    }
};
