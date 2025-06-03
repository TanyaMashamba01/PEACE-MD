const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const util = require("util");
const { getAnti, setAnti, initializeAntiDeleteSettings } = require('../data/antidel');

// Initialize AntiDelete settings
initializeAntiDeleteSettings();

cmd({
    pattern: "antidelete",
    alias: ['antidel', 'ad'],
    desc: "Sets up the Antidelete feature.",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, reply, q, text, isCreator, fromMe }) => {
    if (!isCreator) return reply('⚠️ This command is only for the bot owner. ⚠️');

    try {
        const command = q?.toLowerCase();

        switch (command) {
            // Enable AntiDelete globally (both GC and DM)
            case 'on':
                await setAnti('gc', false); // Disable in Group Chats
                await setAnti('dm', false); // Disable in Direct Messages
                return reply('🔴 _AntiDelete is now OFF for Group Chats and Direct Messages._');

            // Disable AntiDelete for Group Chats
            case 'off gc':
                await setAnti('gc', false);
                return reply('❌ _AntiDelete for Group Chats is now DISABLED._');

            // Disable AntiDelete for Direct Messages
            case 'off dm':
                await setAnti('dm', false);
                return reply('❌ _AntiDelete for Direct Messages is now DISABLED._');

            // Toggle AntiDelete for Group Chats
            case 'set gc':
                const gcStatus = await getAnti('gc');
                await setAnti('gc', !gcStatus); // Toggle state
                return reply(`🔄 _AntiDelete for Group Chats is now ${!gcStatus ? 'ENABLED' : 'DISABLED'}._`);

            // Toggle AntiDelete for Direct Messages
            case 'set dm':
                const dmStatus = await getAnti('dm');
                await setAnti('dm', !dmStatus); // Toggle state
                return reply(`🔄 _AntiDelete for Direct Messages is now ${!dmStatus ? 'ENABLED' : 'DISABLED'}._`);

            // Enable AntiDelete for both Group Chats and Direct Messages
            case 'set all':
                await setAnti('gc', true);
                await setAnti('dm', true);
                return reply('✅ _AntiDelete has been ENABLED for all chats._');

            // Show current AntiDelete status
            case 'status':
                const currentDmStatus = await getAnti('dm');
                const currentGcStatus = await getAnti('gc');
                return reply(`🔍 _AntiDelete Status:_\n\n*DM AntiDelete:* ${currentDmStatus ? '✅ ENABLED' : '❌ DISABLED'}\n*Group Chat AntiDelete:* ${currentGcStatus ? '✅ ENABLED' : '❌ DISABLED'}`);

            // Show Help Message for all available commands
            default:
                const helpMessage = `
                -- *AntiDelete Command Guide:* --
                • \`\`.antidelete on\`\` - 🔴 Turn OFF AntiDelete for all chats (disabled by default)
                • \`\`.antidelete off gc\`\` - ❌ Disable AntiDelete for Group Chats
                • \`\`.antidelete off dm\`\` - ❌ Disable AntiDelete for Direct Messages
                • \`\`.antidelete set gc\`\` - 🔄 Toggle AntiDelete for Group Chats
                • \`\`.antidelete set dm\`\` - 🔄 Toggle AntiDelete for Direct Messages
                • \`\`.antidelete set all\`\` - ✅ Enable AntiDelete for all chats
                • \`\`.antidelete status\`\` - 🔍 Check current AntiDelete status`;

                return reply(helpMessage);
        }
    } catch (e) {
        console.error("⚠️ Error in antidelete command:", e);
        return reply("❌ An error occurred while processing your request.");
    }
});

cmd({
    pattern: "vv3",
    alias: ['retrive', '🔥'],
    desc: "Fetch and resend a ViewOnce message content (image/video/audio).",
    category: "misc",
    use: '<query>',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const quotedMessage = m.msg.contextInfo.quotedMessage; // Get the quoted message

        // Check if it's a ViewOnce message
        if (quotedMessage && quotedMessage.viewOnceMessageV2) {
            const quot = quotedMessage.viewOnceMessageV2;

            if (quot.message.imageMessage) {
                let caption = quot.message.imageMessage.caption;
                let media = await conn.downloadAndSaveMediaMessage(quot.message.imageMessage);
                return conn.sendMessage(from, { image: { url: media }, caption }, { quoted: mek });
            }

            if (quot.message.videoMessage) {
                let caption = quot.message.videoMessage.caption;
                let media = await conn.downloadAndSaveMediaMessage(quot.message.videoMessage);
                return conn.sendMessage(from, { video: { url: media }, caption }, { quoted: mek });
            }

            if (quot.message.audioMessage) {
                let media = await conn.downloadAndSaveMediaMessage(quot.message.audioMessage);
                return conn.sendMessage(from, { audio: { url: media } }, { quoted: mek });
            }
        }

        // If there is no quoted message or it's not a ViewOnce message
        if (!m.quoted) return reply("⚠️ Please reply to a ViewOnce message.");
