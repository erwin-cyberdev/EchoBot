import axios from 'axios'
export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const to = args[0] || 'fr'
  const text = args.slice(1).join(' ')
  if (!text) return sock.sendMessage(from, { text: '❗ Usage: .translate <lang> <texte>' })
  try {
    const res = await axios.post('https://libretranslate.de/translate', { q: text, source: 'auto', target: to, format: 'text' }, { headers: { 'accept': 'application/json' } })
    await sock.sendMessage(from, { text: `🔤 Traduction (${to}):\n${res.data.translatedText}` })
  } catch (e) {
    await sock.sendMessage(from, { text: '❗ Erreur de traduction.' })
  }
}
