// commands/tagall.js
export default {
  name: 'tagall',
  description: 'Mentionne tous les membres du groupe avec un message optionnel',
  adminOnly: true,
  run: async ({ sock, msg, args }) => {
    try {
      const from = msg.key.remoteJid

      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ Cette commande est uniquement utilisable dans un groupe.' })
      }

      // récupère metadata
      const metadata = await sock.groupMetadata(from)
      const participants = metadata.participants || []
      const ids = participants.map(p => p.id)

      if (!ids.length) {
        return sock.sendMessage(from, { text: '❌ Aucun participant trouvé.' })
      }

      // taille max (sécurité)
      const MAX_TAGALL = 500
      if (ids.length > MAX_TAGALL) {
        return sock.sendMessage(from, { text: `❌ Groupe trop grand (${ids.length}) pour utiliser tagall (max ${MAX_TAGALL}).` })
      }

      // check that the sender is admin (robust)
      const sender = msg.key.participant || msg.key.remoteJid
      const me = msg.key?.participant // maybe undefined in pv
      const senderMeta = participants.find(p => p.id === sender)
      const isAdmin = !!(senderMeta?.isAdmin || senderMeta?.admin || senderMeta?.isSuperAdmin)

      if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Seuls les admins peuvent utiliser la commande tagall.' })
      }

      const userMessage = args.join(' ').trim()
      const mentionText = ids.map(p => `@${p.split('@')[0]}`).join(' ')
      const text = userMessage ? `${userMessage}\n\n${mentionText}` : mentionText

      await sock.sendMessage(from, { text, mentions: ids })
    } catch (err) {
      console.error('[TAGALL] Erreur:', err)
      try { await sock.sendMessage(msg.key.remoteJid, { text: '❌ Impossible de mentionner tous les membres.' }) } catch {}
    }
  }
}
