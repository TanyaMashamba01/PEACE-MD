// All your imports remain unchanged
import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';

import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment-timezone';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';
import { File } from 'megajs';
import { fileURLToPath } from 'url';

const { emojis, doReact } = pkg;

const sessionName = "session";
const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function downloadSessionData() {
    console.log("🛠️ Debugging SESSION_ID:", config.SESSION_ID);

    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    const sessdata = config.SESSION_ID.split("PEACE~")[1];

    if (!sessdata || !sessdata.includes("#")) {
        console.error('❌ Invalid SESSION_ID format! It must contain both file ID and decryption key.');
        return false;
    }

    const [fileID, decryptKey] = sessdata.split("#");

    try {
        console.log("🔄 Downloading Session...");
        const file = File.fromURL(`https://mega.nz/file/${fileID}#${decryptKey}`);

        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        await fs.promises.writeFile(credsPath, data);
        console.log("🔒 Session Successfully Loaded !!");
        return true;
    } catch (error) {
        console.error('❌ Failed to download session data:', error);
        return false;
    }
}

async function updateLiveBio(Matrix) {
    try {
        const now = moment().tz('Africa/Nairobi');
        const time = now.format('HH:mm:ss');
        const bio = `🧋ᴘᴏᴘᴋɪᴅ xᴍᴅ ɪs ᴀᴄᴛɪᴠᴇ🧋ᴀᴛ ${time}`;
        await Matrix.updateProfileStatus(bio);
    } catch (error) {
        console.error(chalk.red('Failed to update live bio:'), error);
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`POPKID md using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["popkid", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: "peace md whatsapp user bot" };
            }
        });

        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    start();
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("✔️  ᴘᴏᴘᴋɪᴅ ᴍᴅ ɪs ɴᴏᴡ ᴏɴʟɪɴᴇ ᴀɴᴅ ᴘᴏᴡᴇʀᴇᴅ ᴜᴘ"));

                    const image = { url: "https://files.catbox.moe/nk71o3.jpg" };
                    const caption = `╭━━ *『 ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴄᴏɴɴᴇᴄᴛᴇᴅ 』*
┃
┃  |⚡| *ʙᴏᴛ ɴᴀᴍᴇ:* ᴘᴏᴘᴋɪᴅ xᴍᴅ
┃  |👑| *ᴏᴡɴᴇʀ:* ᴘᴏᴘᴋɪᴅ
┃  |⚙️| *ᴍᴏᴅᴇ:* ${config.MODE}
┃  |🎯| *ᴘʀᴇꜰɪx:* ${config.PREFIX}
┃  |✅| *ꜱᴛᴀᴛᴜꜱ:* ᴏɴʟɪɴᴇ & ꜱᴛᴀʙʟᴇ
┃
╰━━━━━━━━━━━━━━━━━━━╯

*ɪᴛs ʏᴏᴜ,ᴍᴇ,ᴜs🧋🩷.*

╭──────────────────
│ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ*
╰──────────────────`;

                    await Matrix.sendMessage(Matrix.user.id, {
                        image,
                        caption,
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363290715861418@newsletter',
                                newsletterName: "popkid xmd ʙᴏᴛ",
                                serverMessageId: -1,
                            },
                            externalAdReply: {
                                title: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ",
                                body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ",
                                thumbnailUrl: 'https://files.catbox.moe/nk71o3.jpg',
                                sourceUrl: 'https://whatsapp.com/channel/0029VajweHxKQuJP6qnjLM31',
                                mediaType: 1,
                                renderLargerThumbnail: false,
                            },
                        },
                    });

                    if (!global.isLiveBioRunning) {
                        global.isLiveBioRunning = true;
                        setInterval(() => updateLiveBio(Matrix), 10000);
                    }

                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♻️ Connection reestablished after restart."));
                    if (!global.isLiveBioRunning) {
                        global.isLiveBioRunning = true;
                        setInterval(() => updateLiveBio(Matrix), 10000);
                    }
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);
        Matrix.ev.on("messages.upsert", async chatUpdate => {
            await Handler(chatUpdate, Matrix, logger);
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.key.fromMe && config.AUTO_REACT && mek.message) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await doReact(randomEmoji, mek, Matrix);
                }
            } catch (err) {
                console.error('Error during auto reaction:', err);
            }
        });

        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        Matrix.public = config.MODE === "public";

    } catch (error) {
        console.error('❌ Critical Error:', error.stack || error);
        process.exit(1);
    }
}

async function init() {
    global.isLiveBioRunning = false;
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR code.");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("🔒 Session downloaded, starting bot.");
            await start();
        } else {
            console.log("📸 No session found or downloaded, QR code will be printed for authentication.");
            useQR = true;
            await start();
        }
    }
}

init();

// Serve static files
app.use(express.static(path.join(__dirname, 'mydata')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mydata', 'index.html'));
});
app.listen(PORT, () => {
    console.log(`🌐 Server is running on port ${PORT}`);
});
