const scraper = require('liyanaarachchi-animeheavenme');

// Bot Command Handler (.anime <anime_name>)
async function animeCommand(query) {
    if (!query) {
        console.log("❌ කරුණාකර Anime එකක නමක් ඇතුළත් කරන්න! (උදා: .anime dandadan)");
        return;
    }

    try {
        console.log(`🔍 Search කරමින් පවතී: ${query}...`);

        // 1️⃣ Anime එක Search කිරීම
        const searchResults = await scraper.searchAnime(query);

        if (!searchResults || searchResults.length === 0) {
            console.log("❌ කිසිදු Anime එකක් හමු වූයේ නැත.");
            return;
        }

        const selectedAnime = searchResults[0];
        console.log(`\n✅ Anime එක හමු විය: ${selectedAnime.title}`);
        console.log(`🔗 Link: ${selectedAnime.link}`);

        // 2️⃣ Episodes ලැයිස්තුව ලබා ගැනීම
        const episodes = await scraper.getEpisodes(selectedAnime.link);

        if (!episodes || episodes.length === 0) {
            console.log("⚠️ Episodes කිසිවක් හමු වූයේ නැත.");
            return;
        }

        const firstEpisode = episodes[0];
        console.log(`\n📺 ප්‍රථම Episode එක: ${firstEpisode.name} (ID: ${firstEpisode.id})`);

        // 3️⃣ ඍජු Video Direct Link එක ලබා ගැනීම
        const videoLink = await scraper.getVideoLink(firstEpisode.id, selectedAnime.link);

        console.log("\n🎬 Direct Video Link:");
        console.log(videoLink);

        return {
            title: selectedAnime.title,
            episode: firstEpisode.name,
            downloadUrl: videoLink
        };

    } catch (error) {
        console.error("❌ දෝෂයක් සිදු විය:", error.message || error);
    }
}

// -------------------------------------------------------------
// කමන්ඩ් එක ක්‍රියාත්මක කරන ආකාරය (Example Call)
// -------------------------------------------------------------
const args = process.argv.slice(2).join(' '); // Command line arguments ලබා ගැනීම
const searchQuery = args || 'dandadan'; // Argument එකක් නැත්නම් default 'dandadan'

animeCommand(searchQuery);

