export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const a = args[0] || 'Toi'
  const b = args[1] || 'Lui/Elle'
  const score = Math.floor(Math.random()*101)
  await sock.sendMessage(from, { text: `💘 Compatibilité entre ${a} et ${b}: ${score}%` })
}
