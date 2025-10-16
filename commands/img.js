import OpenAI from 'openai'
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function(sock, msg, args) {
  const from = msg.key.remoteJid
  const prompt = args.join(' ')
  if (!prompt) return sock.sendMessage(from, { text: '❗ Usage: .img <description>' })

  try {
    const r = await client.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024' })
    const b64 = r.data[0].b64_json
    const buffer = Buffer.from(b64, 'base64')
    await sock.sendMessage(from, { image: buffer, caption: `🖼️ ${prompt}` })
  } catch (e) {
    console.error(e)
    await sock.sendMessage(from, { text: '❗ Erreur génération image.' })
  }
}
