import fs from 'fs'
import path from 'path'

export default async function(sock, msg) {
  const from = msg.key.remoteJid
  const imagePath = path.join('./media', 'erwinbot.png')

  const menu = `
╔══✪〘 🌟 *ERWIN-BOT MENU* 🌟 〙✪══╗
┃
┃ 🤖 *Général*:
┃ > .ping - Vérifier si le bot est en ligne 🏓
┃ > .info - Infos sur le bot ℹ️
┃ > .menu - Afficher ce menu 📜
┃
┃ 🛠️ *Utilitaires*:
┃ > .time - Heure locale 🌍
┃ > .translate - Traduire du texte 🔤
┃ > .calc - Calculatrice 🧮
┃ > .ai - Assistant IA 🤖
┃ > .define - Définition de mot 📖
┃
┃ 🎵 *Multimédia*:
┃ > .song - Chercher chanson 🎧
┃ > .yt - Télécharger depuis YouTube ▶️
┃ > .img - Générer image IA 🖼️
┃ > .lyrics - Paroles de chanson 🎶
┃ > .pp - Photo de profil d'un utilisateur 🖼️
┃
┃ 🎭 *Fun*:
┃ > .joke - Une blague 😂
┃ > .fact - Fait aléatoire 🤯
┃ > .dice - Lancer de dé 🎲
┃ > .coin - Pile ou face 🪙
┃ > .love - Compatibilité amoureuse 💘
┃ > .extract - Extraire média (view once inclus) 📤
┃
┃ 📚 *Anime & Manga*:
┃ > .anime <nom> - Infos anime 🍿
┃ > .manga <nom> - Infos manga 📖
┃
┃ 🔒 *Gestion de groupe*:
┃ > .promote @user - Promouvoir admin 🏅
┃ > .demote @user - Retirer admin 👎
┃ > .kick @user - Expulser 🚫
┃ > .mute / .unmute - Muet / Réactiver 🔇
┃ > .antilink on/off - Bloquer liens 🔗
┃
╚═════════════════════════════════╝
Made by *FUDJING Manuel Erwin* 💻
  `

  try {
    const buffer = fs.readFileSync(imagePath)
    await sock.sendMessage(from, {
      image: buffer,
      caption: menu
    })
  } catch (e) {
    console.error('Erreur lors de l’envoi du menu:', e)
    await sock.sendMessage(from, { text: '❗ Impossible d’afficher le menu.' })
  }
}
