const axios = require('axios');
const { generateForwardMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// Buffer download function
const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Requests': '1'
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (e) {
        console.error('getBuffer Error:', e);
        return null;
    }
};

// Group admins picker function
const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin === 'admin' || i.admin === 'superadmin') {
            admins.push(i.id);
        }
    }
    return admins;
};

// Random string/filename generator
const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

// Number shortener (1000 -> 1K)
const h2k = (eco) => {
    var lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
    var ma = Math.log10(Math.abs(eco)) / 3 | 0;
    if (ma == 0) return eco;
    var ppo = lyrik[ma];
    var scale = Math.pow(10, ma * 3);
    var scaled = eco / scale;
    var formatt = scaled.toFixed(1);
    if (/\.0$/.test(formatt))
        formatt = formatt.substr(0, formatt.length - 2);
    return formatt + ppo;
};

// URL validator
const isUrl = (url) => {
    return url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
            'gi'
        )
    );
};

// JSON stringifier
const Json = (string) => {
    return JSON.stringify(string, null, 2);
};

// Uptime / Runtime calculator
const runtime = (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : '';
    var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
    var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
    var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
};

// Sleep / Delay
const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// JSON fetcher
const fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

// Forward Helper Function (For forward command)
const copyNForward = async (conn, jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
        message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
        vtype = Object.keys(message.message)[0];
        delete (message.message[vtype]).viewOnce;
        message.message = {
            ...message.message[vtype]
        };
    }

    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != "conversation") context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = {
        ...context,
        ...content[ctype].contextInfo
    };
    const waMessage = await generateWAMessageFromContent(jid, content, options ? {
        ...content[ctype],
        ...options,
        ...(options.contextInfo ? {
            contextInfo: {
                ...content[ctype].contextInfo,
                ...options.contextInfo
            }
        } : {})
    } : {});
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
};

module.exports = { 
    getBuffer, 
    getGroupAdmins, 
    getRandom, 
    h2k, 
    isUrl, 
    Json, 
    runtime, 
    sleep, 
    fetchJson,
    copyNForward 
};
