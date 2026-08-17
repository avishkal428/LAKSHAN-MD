const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys')

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms, downloadMediaMessage } = require('./lib/msg')
const axios = require('axios')
const { exec } = require('child_process')
const https = require('https')
const http = require('http')

const prefix = '.'
const ownerNumber = ['94725337806']
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

// 📌 ඔයාගේ GitHub Repo එකේ Zip Download Link එක මෙතැන තියෙන්නේ:
const DEFAULT_ZIP_URL = 'https://github.com/avishkal428/LAKSHAN-MD/archive/refs/heads/main.zip';

//=================== AUTO UPDATE FUNCTIONS ============================
function runCmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
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

async function handleAutoUpdate(conn, from, mek, args) {
    await conn.sendMessage(from, { text: '🔄 *Bot එක Auto Update වෙමින් පවතී, සුළු මොහොතක් රැඳෙන්න...*' }, { quoted: mek });

    const hasGit = fs.existsSync(path.join(process.cwd(), '.git'));

    if (hasGit) {
        await runCmd('git fetch --all');
        let mainBranch = 'origin/main';
        try { await runCmd('git rev-parse origin/main'); } catch { mainBranch = 'origin/master'; }
        
        await runCmd(`git reset --hard ${mainBranch}`);
        await runCmd('git clean -fd');
        await runCmd('npm install --no-audit --no-fund').catch(() => {});
    } else {
        const zipUrl = args[0] || config.updateZipUrl || DEFAULT_ZIP_URL;

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

    await conn.sendMessage(from, { text: '✅ *Update සාර්ථකයි! Bot එක Restart වෙමින් පවතී...*' }, { quoted: mek });
    await sleep(1500);

    if (fs.existsSync('/.dockerenv')) {
        process.exit(0);
    } else {
        try { await runCmd('pm2 restart all'); } catch { process.exit(0); }
    }
}

//===================DIRECT SESSION-AUTH (Base64)============================
function restoreSessionFromEnv() {
    if (!config.SESSION_ID) {
        console.log('Please add your session to SESSION_ID env !!')
        return false;
    }

    try {
        if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

        const rawSession = config.SESSION_ID;
        const base64Data = rawSession.includes('~') ? rawSession.split('~')[1] : rawSession;
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const credsData = JSON.parse(jsonString);

        fs.writeFileSync(path.join(AUTH_DIR, 'creds.json'), JSON.stringify(credsData, null, 2));
        console.log("Session restored successfully ✅");
        return true;
    } catch (err) {
        console.error("❌ Session restore error:", err.message);
        return false;
    }
}

if (!fs.existsSync(path.join(AUTH_DIR, 'creds.json'))) {
    restoreSessionFromEnv();
}

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

//=============================================

async function connectToWA() {
    console.log("Connecting wa bot 🧬...");
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
    var { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version
    })
        
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
                connectToWA()
            }
        } else if (connection === 'open') {
            console.log('😼 Installing... ')
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() == ".js") {
                    require("./plugins/" + plugin);
                }
            });
            console.log('Plugins installed successful ✅')
            console.log('Bot connected to whatsapp ✅')

            let up = `LAKSHAN-MD-BOT connected successful ✅\n\nPREFIX: ${prefix}`;

            conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", { image: { url: `https://files.catbox.moe/uqofdi.jpg` }, caption: up })
        }
    })

    conn.ev.on('creds.update', saveCreds)  

    conn.ev.on('messages.upsert', async(mek) => {
        mek = mek.messages[0]
        if (!mek.message) return	
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        const m = sms(conn, mek)
        const type = getContentType(mek.message)
        const content = JSON.stringify(mek.message)
        const from = mek.key.remoteJid
        const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
        const senderNumber = sender.split('@')[0]
        const botNumber = conn.user.id.split(':')[0]
        const pushname = mek.pushName || 'Sin Nombre'
        const isMe = botNumber.includes(senderNumber)
        const isOwner = ownerNumber.includes(senderNumber) || isMe
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const participants = isGroup ? await groupMetadata.participants : ''
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false
        const reply = (teks) => {
            conn.sendMessage(from, { text: teks }, { quoted: mek })
        }

        // 📌 UPDATE COMMAND HANDLER (Owner Only)
        if (command === 'update' || command === 'autoupdate') {
            if (!isOwner) return reply('❌ මේ Command එක Owner ට පමණයි!');
            try {
                await handleAutoUpdate(conn, from, mek, args);
            } catch (err) {
                reply(`❌ Update Error: ${err.message}`);
            }
            return;
        }

        conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
            let mime = '';
            let res = await axios.head(url)
            mime = res.headers['content-type']
            if (mime.split("/")[1] === "gif") {
                return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
            }
            let type = mime.split("/")[0] + "Message"
            if (mime === "application/pdf") {
                return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
            }
            if (mime.split("/")[0] === "image") {
                return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
            }
            if (mime.split("/")[0] === "video") {
                return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
            }
            if (mime.split("/")[0] === "audio") {
                return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
            }
        }

        const events = require('./command')
        const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
        if (isCmd) {
            const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})

                try {
                    cmd.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                } catch (e) {
                    console.error("[PLUGIN ERROR] " + e);
                }
            }
        }
        events.commands.map(async(command) => {
            if (body && command.on === "body") {
                command.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            } else if (mek.q && command.on === "text") {
                command.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            } else if (
                (command.on === "image" || command.on === "photo") &&
                mek.type === "imageMessage"
            ) {
                command.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            } else if (
                command.on === "sticker" &&
                mek.type === "stickerMessage"
            ) {
                command.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
            }
        });

    })
}

app.get("/", (req, res) => {
    res.send("hey, bot started✅");
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

setTimeout(() => {
    connectToWA()
}, 4000);
