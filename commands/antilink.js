// Activation simple: toggle on/off par owner (stockage basique en mémoire)
let antilinkEnabled = false

export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const sub = (args[0]||'').toLowerCase()

  if (sub === 'on') { 
    antilinkEnabled = true
    return sock.sendMessage(from,{ text: '🔗 Antilink activé.' })
  }
  if (sub === 'off') { 
    antilinkEnabled = false
    return sock.sendMessage(from,{ text: '🔗 Antilink désactivé.' })
  }
  return sock.sendMessage(from, { text: `🔗 Antilink : ${antilinkEnabled ? 'activé' : 'désactivé'}` })
}
