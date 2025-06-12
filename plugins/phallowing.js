import _0x54865f from '../../config.cjs';
import _0x2097b3 from 'node-fetch';
async function fetchJson(_0x15f3ac, _0x124ff3 = {}) {
  const _0x32d0fb = await _0x2097b3(_0x15f3ac, {
    'method': "GET",
    'headers': {
      'Content-Type': "application/json",
      ..._0x124ff3.headers
    },
    ..._0x124ff3
  });
  if (!_0x32d0fb.ok) {
    throw new Error("HTTP error! status: " + _0x32d0fb.status);
  }
  return await _0x32d0fb.json();
}
const play = async (_0x4ae649, _0x15b006) => {
  const _0x381362 = _0x54865f.PREFIX;
  const _0x5aa761 = _0x4ae649.body.startsWith(_0x381362) ? _0x4ae649.body.slice(_0x381362.length).split(" ")[0x0].toLowerCase() : '';
  const _0x13b03a = _0x4ae649.body.slice(_0x381362.length + _0x5aa761.length).trim();
  if (_0x5aa761 === "play") {
    if (!_0x13b03a) {
      return _0x4ae649.reply("🎶 Tell me the song you're in the mood for! 🎶");
    }
    try {
      await _0x15b006.sendMessage(_0x4ae649.from, {
        'text': "🔎 Finding \"" + _0x13b03a + "\"..."
      }, {
        'quoted': _0x4ae649
      });
      let _0x475888 = await fetchJson("https://api.agatz.xyz/api/ytsearch?message=" + encodeURIComponent(_0x13b03a));
      let _0x4c70d6 = _0x475888.data[0x0];
      if (!_0x4c70d6) {
        return _0x4ae649.reply("Hmm, couldn't find that tune. 😔 Maybe try again?");
      }
      let _0x1ad9ca = await fetchJson("https://api.nexoracle.com/downloader/yt-audio2?apikey=free_key@maher_apis&url=" + _0x4c70d6.url);
      let _0x20d5d2 = _0x1ad9ca.result.audio;
      if (!_0x20d5d2) {
        return _0x4ae649.reply("⚠️ Couldn't grab the audio. Let's try later! 😔");
      }
      await _0x15b006.sendMessage(_0x4ae649.from, {
        'audio': {
          'url': _0x20d5d2
        },
        'fileName': _0x4c70d6.title + ".mp3",
        'mimetype': "audio/mpeg",
        'contextInfo': {
          'forwardingScore': 0x5,
          'isForwarded': true,
          'forwardedNewsletterMessageInfo': {
            'newsletterName': "ᴘᴇᴀᴄᴇ ᴍᴅ",
            'newsletterJid': "120363421564278292@newsletter"
          },
          'externalAdReply': {
            'title': "🎧 Now playing: " + _0x4c70d6.title + " 🎧",
            'body': ".mp3 audio delivered",
            'thumbnailUrl': _0x4c70d6.thumbnail || "https://files.catbox.moe/og4tsk.jpg",
            'mediaType': 0x1,
            'renderLargerThumbnail': true,
            'thumbnailHeight': 0x1f4,
            'thumbnailWidth': 0x1f4
          }
        }
      }, {
        'quoted': _0x4ae649
      });
    } catch (_0x46f490) {
      console.error("Error in play command:", _0x46f490);
      _0x4ae649.reply("Hmm, something went wrong. 😅 Let's try again!");
    }
  }
};
export default play;
