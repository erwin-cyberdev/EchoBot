import moment from 'moment-timezone'
export default async function(sock, msg) {
  const from = msg.key.remoteJid
  const tz = process.env.TIMEZONE || 'Africa/Douala'
  const now = moment().tz(tz).format('dddd, DD MMMM YYYY HH:mm:ss')
  await sock.sendMessage(from, { text: `🕒 Heure locale (${tz}) : ${now}` })
}
