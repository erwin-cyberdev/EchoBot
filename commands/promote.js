export default async function(sock, msg) {
  const from = msg.key.remoteJid
  if (!msg.key.participant) return sock.sendMessage(from, { text: '❗ Utiliser en groupe.' })

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (!mentioned.length) return sock.sendMessage(from, { text: '❗ Mentionne l\'utilisateur.' })

  await sock.groupParticipantsUpdate(from, mentioned, 'promote')
  await sock.sendMessage(from, { text: '✅ Utilisateur promu.' })
}
