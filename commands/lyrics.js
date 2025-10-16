import axios from 'axios'

export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const query = args.join(' ')
  if (!query) return sock.sendMessage(from, { text: '❗ Usage: .lyrics <titre - artiste>' })

  try {
    const [title, artist] = query.split(' - ')
    const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist||'')}/${encodeURIComponent(title||'')}`)
    await sock.sendMessage(from, { text: `🎶 Paroles :\n${res.data.lyrics}` })
  } catch (e) {
    await sock.sendMessage(from, { text: '❗ Paroles introuvables.' })
  }
}
