// commands/accept.js
import { optInUser } from '../utils/consent.js'

export default async function(sock, msg) {
  const from = msg.key.remoteJid
  const sender = msg.key.participant || from

  const ok = optInUser(sender)
  await sock.sendMessage(from, { text: ok ? '✅ Merci ! Vous avez accepté les conditions d’utilisation.' : '⚠️ Une erreur est survenue.' }, { quoted: msg })
}
