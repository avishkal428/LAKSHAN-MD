const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    name: 'cinesubz',
    alias: ['cs', 'movie'],
    desc: 'Get Cinesubz Movie Download Links',
    category: 'download',
    async execute(m, { conn, args }) {
        try {
            if (!args[0]) {
                return m.reply('❌ කරුණාකර Cinesubz Movie Link එක ලබා දෙන්න!\n\nඋදා: `.cinesubz https://cinesubz.lk/movies/m-r-p-neekentha-naakentha-2026-sinhala-subtitles/`');
            }

            const movieUrl = args[0];
            await m.reply('⏳ Movie Links සෙවීම ආරම්භ කළා, මඳ වෙලාවක් රැඳී සිටින්න...');

            const { data } = await axios.get(movieUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(data);
            let downloadLinks = [];

            $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                const text = $(element).text().trim();

                if (href && href.includes('zt-links')) {
                    downloadLinks.push(`🎬 *${text || 'Download Link'}*\n🔗 ${href}`);
                }
            });

            if (downloadLinks.length > 0) {
                let caption = `🍿 *Cinesubz Movie Download Links*\n\n` + downloadLinks.join('\n\n');
                await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
            } else {
                await m.reply('✘ Download Links කිසිවක් සොයාගැනීමට නොහැකි විය.');
            }

        } catch (error) {
            console.error(error);
            await m.reply('✘ Link එක extract කිරීමේදී Error එකක් ආවා.');
        }
    }
};
