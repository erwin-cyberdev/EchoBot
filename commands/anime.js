import axios from 'axios'

export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const q = args.join(' ')
  if (!q) return sock.sendMessage(from, { text: '❗ Usage: .anime <nom>' })

  try {
    const res = await axios.get(`${process.env.JIKAN_URL || 'https://api.jikan.moe/v4'}/anime?q=${encodeURIComponent(q)}&limit=1`)
    const d = res.data.data[0]
    if (!d) return sock.sendMessage(from, { text: '❗ Anime introuvable.' })

    const txt = `🎬 ${d.title}\n🗓️ ${d.year||'N/A'}\n⭐ ${d.score||'N/A'}\n📖 ${d.synopsis}`
    await sock.sendMessage(from, { text: txt })
  } catch (e) {
    console.error(e)
    await sock.sendMessage(from, { text: '❗ Erreur anime.' })
  }
}
