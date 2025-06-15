import config from '../../config.cjs';
import fetch from 'node-fetch'; // Ensure you have this installed

const repo = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "repo") {
    await m.React('🖇️'); // A gem for a precious repo!
    const repoUrl = 'https://github.com/Peacemaker-cyber/PEACE-MD';
    const imageUrl = 'https://I.postimg.cc/4NdSqms8/MidKing.jpg'; // ❗ REPLACE WITH YOUR ACTUAL IMAGE URL

    try {
      const apiUrl = `https://api.github.com/repos/Peacemaker-cyber/PEACE-MD`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data && data.forks_count !== undefined && data.stargazers_count !== undefined) {
        const stylishMessage = {
          image: { url: imageUrl },
          caption: `
╭───『 『ᴶᴼˢᴴᵁᴬᴹᴬᴹᴮᴼ1』 REPO 』───⳹
│
│🚀 *Explore the Innovation Hub!*
│
│ 📦 *Repository*: ${https://github.com/mambowepanzvimbo/norepo}   
│ 👑 *Owner*: 『ᴶᴼˢᴴᵁᴬᴹᴬᴹᴮᴼ1』 
│ ⭐ *Stars*: \`${data.stargazers_count}\` 
│ ⑂ *Forks*: \`${data.forks_count}\`  
│ 🔗 *URL*: https://whatsapp.com/channel/0029VaraMtfFcowAKRdDdp1T
│
│ 📝 *Description*:
│ 🤝 *Join the Community!* 
│   Contribute & Shape the Future!  
│
╰────────────────⳹
> Follow and Subscribe to https://youtube.com/@joshuamambo1💚
`.trim(),
        };

        sock.sendMessage(m.from, stylishMessage, { quoted: m });
      } else {
        sock.sendMessage(m.from, { text: '⚠️ Could not retrieve full repo details. Please try again later. 🥺', quoted: m });
      }
    } catch (error) {
      console.error("Error fetching repo info:", error);
      sock.sendMessage(m.from, { text: '🚨 Error encountered while fetching repo data. 😢', quoted: m });
    } finally {
      await m.React('✅');
    }
  }
};

export default repo;
