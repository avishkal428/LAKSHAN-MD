const {
  default: makeWASocket,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
  generateForwardMessageContent,
  generateWAMessageFromContent
} = require('@whiskeysockets/baileys')

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const config = require('./config')
const util = require('util')
const { sms, downloadMediaMessage } = require('./lib/msg')
const axios = require('axios')
const { getMode } = require('./lib/botMode')
const prefix = '.'

const ownerNumber = ['94724898578']

// =========================== AUTO NEWSLETTER FOLLOW + AUTO REACT ===========================
// Add the JID(s) of your own WhatsApp Channel(s) here (ends with @newsletter).
// Get it from Channel info -> Share -> Copy link, e.g. https://whatsapp.com/channel/XXXXXXXXX
// then resolve it once with: await sock.newsletterMetadata('invite', 'XXXXXXXXX')
// and copy the "id" field from the result.
const NEWSLETTER_JIDS = [
  '120363427760007429@newsletter'
]
const NEWSLETTER_REACT_EMOJIS = ['❤️', '🔥', '👍', '😍', '🎉']

// Follows every configured newsletter. Safe to call repeatedly -- Baileys/WhatsApp
// just no-ops if you're already following, so we swallow errors instead of tracking state.
async function autoFollowNewsletters(currentSock) {
  for (const jid of NEWSLETTER_JIDS) {
    if (!jid || jid.includes('XXXXXXXXXX')) continue // skip the placeholder
    try {
      await currentSock.newsletterFollow(jid)
      console.log(`[NEWSLETTER] Following ${jid} ✅`)
    } catch (e) {
      // already following, or a transient error -- not worth crashing the bot over
      console.log(`[NEWSLETTER] Follow skipped for ${jid}: ${e.message}`)
    }
  }
}

const express = require('express')
const app = express()
const port = process.env.PORT || 5000
app.use(express.json())

// =========================== SESSION STORAGE (MongoDB) ===========================
// Heroku's filesystem is ephemeral -- anything saved to disk (like auth_info_baileys/)
// is wiped on every redeploy, dyno restart, or dyno cycle. Storing the session in
// MongoDB instead means you only have to pair once.
const { MongoClient } = require('mongodb')
const { useMongoAuthState } = require('./lib/mongoAuthState')

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Set it with: heroku config:set MONGODB_URI="your-connection-string"')
}

const mongoClient = new MongoClient(process.env.MONGODB_URI)
let authCollection = null

async function initMongo() {
  await mongoClient.connect()
  authCollection = mongoClient.db('whatsapp').collection('authState')
  console.log('Connected to MongoDB for session storage ✅')
}

async function hasSession() {
  if (!authCollection) return false
  const count = await authCollection.countDocuments()
  return count > 0
}

// =========================== BOT / PAIRING STATE ===========================
let sock = null
let isConnected = false
let pairingCode = null
let pairingError = null
let connecting = false
let pluginsLoaded = false
let pairingTimer = null
let sockGeneration = 0

const PAIRING_TIMEOUT_MS = 2 * 60 * 1000 // give the user 2 minutes to enter the code

// If the saved session is stale/invalid, WhatsApp closes the connection almost
// instantly on every reconnect attempt, causing an infinite loop that also blocks
// new pairing requests. Track fast repeated closes and wipe the bad session instead.
let recentCloseTimestamps = []
const RECONNECT_FLOOD_WINDOW_MS = 60 * 1000
const RECONNECT_FLOOD_THRESHOLD = 4

function isReconnectFlooding() {
  const now = Date.now()
  recentCloseTimestamps = recentCloseTimestamps.filter(t => now - t < RECONNECT_FLOOD_WINDOW_MS)
  recentCloseTimestamps.push(now)
  return recentCloseTimestamps.length >= RECONNECT_FLOOD_THRESHOLD
}

function clearPairingTimer() {
  if (pairingTimer) {
    clearTimeout(pairingTimer)
    pairingTimer = null
  }
}

// Wipes any half-finished session so the next pairing attempt starts clean.
function resetSession(message) {
  clearPairingTimer()
  sockGeneration++ // invalidate any in-flight socket's event handlers so they don't auto-reconnect
  if (authCollection) {
    authCollection.deleteMany({}).catch(() => {})
  }
  pairingCode = null
  pairingError = message || null
  isConnected = false
  connecting = false
  sock = null
}

function loadPlugins() {
  if (pluginsLoaded) return
  const pluginsDir = path.join(__dirname, 'plugins')
  fs.readdirSync(pluginsDir).forEach((plugin) => {
    if (path.extname(plugin).toLowerCase() === '.js') {
      require(path.join(pluginsDir, plugin))
    }
  })
  pluginsLoaded = true
  console.log('Plugins installed successful ✅')
}

async function startBot(pairNumber) {
  if (connecting) return
  connecting = true
  pairingError = null
  const myGen = ++sockGeneration

  try {
    const { state, saveCreds } = await useMongoAuthState(authCollection)
    const { version } = await fetchLatestBaileysVersion()

    const currentSock = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: true,
      auth: state,
      version
    })
    sock = currentSock

    if (pairNumber && !currentSock.authState.creds.registered) {
      await sleep(3000)
      if (myGen !== sockGeneration) return // superseded while waiting (e.g. a reset happened)
      try {
        const cleanNumber = pairNumber.replace(/[^0-9]/g, '')
        const code = await currentSock.requestPairingCode(cleanNumber)
        if (myGen !== sockGeneration) return // superseded while awaiting the code
        pairingCode = code
        console.log(`Pairing code for ${cleanNumber}: ${code}`)

        clearPairingTimer()
        pairingTimer = setTimeout(() => {
          if (myGen !== sockGeneration) return // already superseded, nothing to clean up
          console.log('Pairing was not completed in time. Clearing session — request a new code to try again.')
          resetSession('Pairing code expired before it was used. Please request a new one.')
          try { currentSock.end(new Error('pairing timeout')) } catch (e) {}
        }, PAIRING_TIMEOUT_MS)
      } catch (e) {
        pairingError = 'Could not generate a pairing code. Double check the number and try again.'
        console.error('Pairing code error:', e)
        connecting = false
        return
      }
    }

    currentSock.ev.on('creds.update', saveCreds)

    currentSock.ev.on('connection.update', (update) => {
      if (myGen !== sockGeneration) return // stale socket, a newer attempt has already taken over
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        isConnected = true
        pairingCode = null
        pairingError = null
        connecting = false
        clearPairingTimer()
        console.log('Bot connected to WhatsApp ✅')
        loadPlugins()
        autoFollowNewsletters(currentSock).catch(() => {})

        const up = ` connected successful ✅\n\nPREFIX: ${prefix}`
        currentSock.sendMessage(ownerNumber[0] + '@s.whatsapp.net', { image: { url: config.ALIVE_IMG }, caption: up }).catch(() => {})
      } else if (connection === 'close') {
        const wasConnected = isConnected
        isConnected = false
        connecting = false
        const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
          ? lastDisconnect.error.output.statusCode
          : null

        if (statusCode === DisconnectReason.loggedOut) {
          // Either pairing was rejected, or the device was removed from WhatsApp's linked devices list.
          console.log('Device logged out / unlinked. Clearing session — please pair again from the web page.')
          resetSession(wasConnected ? 'This device was unlinked from WhatsApp. Please pair again.' : null)
        } else if (isReconnectFlooding()) {
          console.log('Connection keeps closing immediately — the saved session looks invalid. Clearing it so you can pair again.')
          resetSession('The previous session stopped working. Please pair again.')
        } else {
          console.log('Connection closed, reconnecting...')
          startBot()
        }
      }
    })

    currentSock.ev.on('messages.upsert', async (mek) => {
      if (myGen !== sockGeneration) return // stale socket, ignore
      mek = mek.messages[0]
      if (!mek.message) return
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
      if (mek.key && mek.key.remoteJid === 'status@broadcast') return

      if (mek.key && mek.key.remoteJid && mek.key.remoteJid.endsWith('@newsletter')) {
        try {
          // Newsletter posts use a "server id" for reactions, not the normal message key id.
          // Baileys exposes it as mek.newsletterServerId on the WebMessageInfo object.
          const serverId = mek.newsletterServerId || mek.key.id
          const emoji = NEWSLETTER_REACT_EMOJIS[Math.floor(Math.random() * NEWSLETTER_REACT_EMOJIS.length)]
          await currentSock.newsletterReactMessage(mek.key.remoteJid, String(serverId), emoji)
          console.log(`[NEWSLETTER] Reacted ${emoji} to post ${serverId} in ${mek.key.remoteJid}`)
        } catch (e) {
          console.log('[NEWSLETTER] React failed:', e.message)
        }
        return // channel posts aren't chat messages -- nothing else below applies to them
      }

      const m = sms(currentSock, mek)
      const type = getContentType(mek.message)
      const from = mek.key.remoteJid
      console.log(`[MSG] from=${from} type=${type} fromMe=${mek.key.fromMe}`)
      const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
      const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
      const isCmd = body.startsWith(prefix)
      const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')
      const isGroup = from.endsWith('@g.us')
      const sender = mek.key.fromMe ? (currentSock.user.id.split(':')[0] + '@s.whatsapp.net' || currentSock.user.id) : (mek.key.participant || mek.key.remoteJid)
      const senderNumber = sender.split('@')[0]
      const botNumber = currentSock.user.id.split(':')[0]
      const pushname = mek.pushName || 'Sin Nombre'
      const isMe = botNumber.includes(senderNumber)
      const isOwner = ownerNumber.includes(senderNumber) || isMe
      const botNumber2 = await jidNormalizedUser(currentSock.user.id)
      const groupMetadata = isGroup ? await currentSock.groupMetadata(from).catch(e => { }) : ''
      const groupName = isGroup ? groupMetadata.subject : ''
      const participants = isGroup ? await groupMetadata.participants : ''
      const groupAdmins = isGroup ? getGroupAdmins(participants) : ''
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false
      const reply = (teks) => {
        currentSock.sendMessage(from, { text: teks }, { quoted: mek })
      }

      currentSock.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = ''
        let res = await axios.head(url)
        mime = res.headers['content-type']
        if (mime.split('/')[1] === 'gif') {
          return currentSock.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
        }
        let type = mime.split('/')[0] + 'Message'
        if (mime === 'application/pdf') {
          return currentSock.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split('/')[0] === 'image') {
          return currentSock.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split('/')[0] === 'video') {
          return currentSock.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
        }
        if (mime.split('/')[0] === 'audio') {
          return currentSock.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
        }
      }

      currentSock.forwardMessage = async (jid, message, forceForward = false, options = {}) => {
        if (options.readViewOnce) {
          message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
          const vtype = Object.keys(message.message.viewOnceMessage.message)[0]
          delete message.message.viewOnceMessage.message[vtype].viewOnce
          message.message = { ...message.message.viewOnceMessage.message }
        }

        const mtype = Object.keys(message.message)[0]
        const content = await generateForwardMessageContent(message, forceForward)
        const ctype = Object.keys(content)[0]
        const context = mtype != 'conversation' ? (message.message[mtype].contextInfo || {}) : {}
        content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo }

        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
          ...content[ctype],
          ...options,
          ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {})
        } : {})
        await currentSock.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
        return waMessage
      }

      const events = require('./command')
      const cmdName = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : false
      if (isCmd) console.log(`[CMD] isCmd=${isCmd} cmdName=${cmdName} totalCommandsRegistered=${events.commands.length}`)
      if (isCmd) {
        const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
        if (cmd) {
          const mode = await getMode()
          if (mode === 'private' && !isOwner) return
          if (mode === 'inbox' && isGroup) return
          if (mode === 'group' && !isGroup) return

          if (cmd.react) currentSock.sendMessage(from, { react: { text: cmd.react, key: mek.key } })

          try {
            cmd.function(currentSock, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
          } catch (e) {
            console.error('[PLUGIN ERROR] ' + e)
          }
        }
      }
      events.commands.map(async (command) => {
        if (body && command.on === 'body') {
          command.function(currentSock, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } else if (mek.q && command.on === 'text') {
          command.function(currentSock, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } else if (
          (command.on === 'image' || command.on === 'photo') &&
          mek.type === 'imageMessage'
        ) {
          command.function(currentSock, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } else if (
          command.on === 'sticker' &&
          mek.type === 'stickerMessage'
        ) {
          command.function(currentSock, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        }
      })
    })
  } catch (e) {
    connecting = false
    pairingError = 'Failed to start the bot session. Please try again.'
    console.error('Failed to start bot:', e)
        }
