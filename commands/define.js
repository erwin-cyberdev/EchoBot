import axios from 'axios'
export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const word = args.join(' ')
  if (!word) return sock.sendMessage(from, { text: '❗ Usage: .define <mot>' })
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    const mean = res.data[0].meanings[0].definitions[0].definition
    await sock.sendMessage(from, { text: `📘 ${word}: ${mean}` })
  } catch (e) {
    await sock.sendMessage(from, { text: '❗ Définition introuvable.' })
  }
}
