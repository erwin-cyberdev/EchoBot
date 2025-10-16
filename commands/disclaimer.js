export default {
  name: 'disclaimer',
  description: 'Affiche le disclaimer / avertissement du bot',
  run: async ({ sock, msg }) => {
    try {
      const from = msg.key.remoteJid;

      const disclaimerText = `
⚠️ *Disclaimer Erwin-Bot* ⚠️

1. Ce bot est fourni à titre informatif et de divertissement. 
2. L'utilisation du bot est sous votre propre responsabilité. 
3. L'auteur ne pourra être tenu responsable des dommages, pertes de données ou mauvaises utilisations. 
4. Toute utilisation abusive ou illégale peut entraîner le blocage ou la suppression de l'accès.
5. Respectez les règles de WhatsApp et des groupes dans lesquels le bot est utilisé vous pourriez vous faire bannir par whatsapp sinon.

*Merci de votre compréhension.*
      `.trim();

      await sock.sendMessage(from, { text: disclaimerText });
    } catch (err) {
      console.error('[DISCLAIMER] Erreur:', err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Impossible d\'afficher le disclaimer.' });
    }
  }
};
