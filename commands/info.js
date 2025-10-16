import fs from 'fs'
import path from 'path'

export default async function(sock, msg) {
  const from = msg.key.remoteJid
  const name = process.env.BOT_NAME || 'Erwin-Bot'
  const owner = process.env.OWNER || 'Owner'

  // Lecture du package.json sans utiliser import assert
  const pkgPath = path.resolve('./package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  const text = `🤖 *${name}*
Version: ${pkg.version}
Créateur: ${owner}`

  await sock.sendMessage(from, { text })
}
