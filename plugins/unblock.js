import config from '../../config.cjs';

const unblock = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    const prefix = config.PREFIX;
const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
const text = m.body.slice(prefix.length + cmd.length).trim();

    const validCommands = ['unblock'];

    if (!validCommands.includes(cmd)) return;
    
    if (!isCreator) return m.reply("*THIS IS AN OWNER COMMAND*");

    let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await gss.updateBlockStatus(users, 'unblock')
      .then((res) => m.reply(`Unblocked ${users.split('@')[0]} successfully.`))
      .catch((err) => m.reply(`Failed to unblock user: ${err}`));
  } catch (error) {
    console.error('Error:', error);
    m.reply('sᴏᴜɴᴅs ʏᴏᴜ ʟɪᴋᴇ ᴛʜɪs ᴘᴇʀsᴏɴ sᴏ 𝗣𝗘𝗔𝗖𝗘𝗠𝗔𝗞𝗘𝗥 ᴍᴇ ᴅɪᴅɴ'ᴛ ʙʟᴏᴄᴋ ʜɪᴍ/ʜᴇʀ');
  }
};

export default unblock;
