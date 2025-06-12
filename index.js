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
import { File } from 'megajs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment-timezone';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';

const { emojis, doReact } = pkg;
const prefix = process.env.PREFIX || config.PREFIX;
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

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function downloadSessionData() {
    console.log("Debugging SESSION_ID:", config.SESSION_ID);

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

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 PEACE-MD using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["PEACE-MD", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                return { conversation: " cloid ai whatsapp user bot" };
            }
        });

        Matrix.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    start();
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Connected Successfully PEACE-MD 🤍"));
                    Matrix.sendMessage(Matrix.user.id, {
                        image: { url: "https://files.catbox.moe/n0dgjr.jpg" },
                        caption: `*✨ Hello, 𝐏ᴇᴀᴄᴇ 𝐌ᴅ User! ✨*\n\n╭─〔 *🤖 𝐏ᴇᴀᴄᴇ 𝐌ᴅ* 〕\n├─▸ *Ultrasonic Power and Infinite Speed!*\n╰─➤ *Your New WhatsApp Sidekick is Here!*\n\n*❤️𝐓ʜᴀɴᴋ 𝐘ᴏᴜ 𝐅ᴏʀ 𝐂ʜᴏᴏꜱɪɴɢ 𝐏ᴇᴀᴄᴇ 𝐌ᴅ!*\n\n╭──〔 🔗 *Quick Links* 〕\n├─ 📢 *Join Our Channel:*\n│   Click [**Here**](https://whatsapp.com/channel/0029VbA9YD323n3ko5xL7J1e)\n├─ ⭐ *Give Us a Star:*\n│   Star Us [**Here**](Peacemaker-cyber/PEACE-MD)\n╰─🛠️ *Prefix:* \`${prefix}\`\n\n> _© 𝐏ᴏᴡᴇʀᴇᴅ 𝐁ʏ 𝐏ᴇᴀᴄᴇ 𝐌ᴅ_`
                    });
                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♻️ Connection reestablished after restart."));
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);

        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        // Set public/private mode
        Matrix.public = config.MODE === "public";

        // Unified messages.upsert
        Matrix.ev.on("messages.upsert", async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages?.[0];
                if (!mek || !mek.message) return;

                const fromJid = mek.key.participant || mek.key.remoteJid;

                // Main command handler
                await Handler(chatUpdate, Matrix, logger);

                // Auto React
                if (!mek.key.fromMe && config.AUTO_REACT) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await doReact(randomEmoji, mek, Matrix);
                }

                // Auto Status Seen, React, Reply
                if (mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN) {
                    await Matrix.readMessages([mek.key]);

                    if (config.READ_MESSAGE === 'true') {
                        console.log(`Marked message from ${mek.key.remoteJid} as read.`);
                    }

                    if (config.AUTO_STATUS_REACT === "true") {
                        const jawadlike = await Matrix.decodeJid(Matrix.user.id);
                        const statusEmojis = ['❤️', '💯', '🔥', '💎', '💗', '🤍', '😎', '🌟'];
                        const randomEmoji = statusEmojis[Math.floor(Math.random() * statusEmojis.length)];
                        await Matrix.sendMessage(mek.key.remoteJid, {
                            react: {
                                text: randomEmoji,
                                key: mek.key,
                            }
                        }, { statusJidList: [mek.key.participant, jawadlike] });
                    }

                    if (config.AUTO_STATUS_REPLY) {
                        const msg = config.STATUS_READ_MSG || '✅ Auto Status Seen Bot By XEON-XMD';
                        await Matrix.sendMessage(fromJid, { text: msg }, { quoted: mek });
                    }
                }

            } catch (err) {
                console.error('❌ Error handling messages.upsert:', err);
            }
        });

    } catch (error) {
        console.error('❌ Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR code.");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("🔒 Session downloaded, starting bot.");
            await start();
        } else {
            console.log("⚠️ No session found or downloaded, QR code will be printed for authentication.");
            useQR = true;
            await start();
        }
    }
}

init();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`🌐 Server is running on port ${PORT}`);
});
// Powered By 𝐏ᴇᴀᴄᴇ 𝐌ᴅ
