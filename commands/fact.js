import axios from 'axios'
export default async function(sock, msg) {
  const from = msg.key.remoteJid
  try {
    const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en')
    await sock.sendMessage(from, { text: `🤯 ${res.data.text}` })
  } catch(e) {
    await sock.sendMessage(from, { text: '❗ Impossible de récupérer un fait.' })
  }
}
