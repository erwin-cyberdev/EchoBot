// commands/pp.js
import axios from 'axios'

export default async function (sock, msg, args = []) {
  const remoteJid = msg.key.remoteJid
  // déterminer la cible
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.participant
  const sender = msg.key.participant || msg.key.remoteJid

  let target = mentioned.length ? mentioned[0] : (quotedParticipant || sender)

  // si target semble être un numéro sans @, tenter d'ajouter domaine
  if (typeof target === 'string' && !target.includes('@')) {
    if (/^\d+$/.test(target)) target = `${target}@s.whatsapp.net`
  }

  try {
    // profilePictureUrl peut lever si pas trouvé
    let url
    try {
      url = await sock.profilePictureUrl(target, 'image')
    } catch (e) {
      // la lib peut lancer, ou renvoyer undefined
      url = undefined
    }

    if (!url) {
      return await sock.sendMessage(remoteJid, { text: '❗ Aucun photo de profil publique trouvée pour cet utilisateur.' }, { quoted: msg })
    }

    // fetch l'image en binaire
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10_000 })
    const buffer = Buffer.from(res.data)

    // envoyer l'image
    await sock.sendMessage(remoteJid, { image: buffer, caption: `📸 Photo de profil de ${target}` }, { quoted: msg })
  } catch (err) {
    console.error('pp command error', err)
    try {
      await sock.sendMessage(remoteJid, { text: '❗ Impossible de récupérer la photo de profil. (ou non accessible/protégée)' }, { quoted: msg })
    } catch {}
  }
}
