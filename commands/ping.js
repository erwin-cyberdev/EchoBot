export default async function(sock, msg) {
  const from = msg.key.remoteJid
  await sock.sendMessage(from, { text: '🏓 Pong ! Erwin-Bot est en ligne ✨' })
}
