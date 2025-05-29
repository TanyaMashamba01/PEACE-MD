const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "owner",
    react: "✅",
    desc: "Displays bot owner's contact info",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const ownerNumber = config.OWNER_NUMBER;
        const ownerName = config.OWNER_NAME;

        if (!ownerNumber || !ownerName) {
            return reply("Owner details are missing in config file.");
        }

        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${ownerName}`,
            `TEL;type=CELL;type=VOICE;waid=${ownerNumber.replace('+', '')}:${ownerNumber}`,
            'END:VCARD'
        ].join('\n');

        // Attempt to fetch the profile picture of the owner
        let profilePicUrl;
        try {
            profilePicUrl = await conn.profilePictureUrl(`${ownerNumber.replace('+', '')}@s.whatsapp.net`, 'image');
        } catch (err) {
            // fallback to a default image if profile picture is not available
            profilePicUrl = 'https://telegra.ph/file/265c672094dfa87caea19.jpg';
        }

        // Send the contact card (shows "Message / Add Contact")
        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply(`An error occurred: ${error.message}`);
    }
});
