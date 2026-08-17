const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { cmd } = require('../command');

// 📌 ඔයාගේ GitHub Repo එකේ ZIP Download Link එක:
const DEFAULT_ZIP_URL = 'https://github.com/avishkal428/LAKSHAN-MD/archive/refs/heads/main.zip';

function runCmd(cmdStr) {
    return new Promise((resolve, reject) => {
        exec(cmdStr, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString().trim()));
            resolve((stdout || '').toString().trim());
        });
    });
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        if (visited.has(url) || visited.size > 5) return reject(new Error('Too many redirects'));
        visited.add(url);

        const client = url.startsWith('https://') ? https : http;
        client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                return downloadFile(new URL(res.headers.location, url).toString(), dest, visited).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', (err) => fs.unlink(dest, () => reject(err)));
        }).on('error', (err) => fs.unlink(dest, () => reject(err)));
    });
}

async function extractZip(zipPath, outDir) {
    if (process.platform === 'win32') {
        await runCmd(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`);
        return;
    }
    try { await runCmd(`unzip -o '${zipPath}' -d '${outDir}'`); return; } catch {}
    try { await runCmd(`7z x -y '${zipPath}' -o'${outDir}'`); return; } catch {}
    throw new Error('No unzip tool found on server');
}

function copyRecursive(src, dest, ignore = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        if (fs.lstatSync(s).isDirectory()) {
            copyRecursive(s, d, ignore);
        } else {
            fs.copyFileSync(s, d);
        }
    }
}

cmd({
    pattern: "update",
    alias: ["autoupdate", "up"],
    react: "🔄",
    desc: "Update the bot to latest version",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply, args }) => {
    try {
        if (!isOwner) return reply('❌ මේ Command එක Owner ට පමණයි!');

        await reply('🔄 *Bot එක Auto Update වෙමින් පවතී, සුළු මොහොතක් රැඳෙන්න...*');

        const hasGit = fs.existsSync(path.join(process.cwd(), '.git'));

        if (hasGit) {
            // 1. Git fetch කර බ්‍රාන්ච් සියල්ල Sync කිරීම
            await runCmd('git fetch --all --prune');

            // 2. Active Branch එක (main හෝ master) Auto Detect කිරීම
            let targetBranch = 'origin/main';
            try {
                const currentBranch = await runCmd('git rev-parse --abbrev-ref HEAD');
                if (currentBranch && currentBranch !== 'HEAD') {
                    targetBranch = `origin/${currentBranch}`;
                }
            } catch {
                try { 
                    await runCmd('git rev-parse origin/main'); 
                    targetBranch = 'origin/main'; 
                } catch { 
                    targetBranch = 'origin/master'; 
                }
            }

            // 3. Reset කර Clean කිරීම
            await runCmd(`git reset --hard ${targetBranch}`);
            await runCmd('git clean -fd');
            await runCmd('npm install --no-audit --no-fund').catch(() => {});
        } else {
            // Git නැතිනම් direct Zip Download
            const zipUrl = args[0] || DEFAULT_ZIP_URL;

            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const zipPath = path.join(tmpDir, 'update.zip');
            const extractTo = path.join(tmpDir, 'extract');

            if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });

            await downloadFile(zipUrl, zipPath);
            await extractZip(zipPath, extractTo);

            const entries = fs.readdirSync(extractTo).filter(n => !n.startsWith('.')).map(n => path.join(extractTo, n));
            const srcRoot = (entries.length === 1 && fs.lstatSync(entries[0]).isDirectory()) ? entries[0] : extractTo;

            const ignore = ['node_modules', '.git', 'session', 'auth_info_baileys', 'tmp', 'temp', 'data', '.env'];
            copyRecursive(srcRoot, process.cwd(), ignore);

            try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
            try { fs.rmSync(zipPath, { force: true }); } catch {}

            await runCmd('npm install --no-audit --no-fund').catch(() => {});
        }

        await reply('✅ *Update සාර්ථකයි! Bot එක Restart වෙමින් පවතී...*');

        setTimeout(async () => {
            if (fs.existsSync('/.dockerenv')) {
                process.exit(0);
            } else {
                try { await runCmd('pm2 restart all'); } catch { process.exit(0); }
            }
        }, 1500);

    } catch (err) {
        console.error(err);
        reply(`❌ Update Error: ${err.message}`);
    }
});

