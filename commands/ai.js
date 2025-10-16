// commands/ai.js
export default async function (sock, msg, args = []) {
  const from = msg.key.remoteJid
  const prompt = args.join(' ').trim()
  if (!prompt) return sock.sendMessage(from, { text: '❗ Usage: .ai <ta question>' })

  // lazy import
  let OpenAI
  try {
    OpenAI = (await import('openai')).default
  } catch (e) {
    console.error('openai import error', e)
    return sock.sendMessage(from, { text: '❗ Module OpenAI introuvable sur le serveur.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return sock.sendMessage(from, {
      text: '❗ OPENAI_API_KEY non configurée. Ajoute-la dans .env pour utiliser .ai'
    })
  }

  const client = new OpenAI({ apiKey })

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  // tentative avec retry pour rate limits temporaires (mais pas pour insuffisance de quota)
  const maxAttempts = 3
  let attempt = 0
  while (attempt < maxAttempts) {
    attempt++
    try {
      // NOTE: méthode responses.create utilisée pour v1 new SDK; adapte si tu utilises complet autre call
      const res = await client.responses.create({ model: 'gpt-4o-mini', input: prompt })
      const out = res.output_text || (res.output && res.output[0]?.content?.[0]?.text) || 'Pas de réponse.'
      return sock.sendMessage(from, { text: `🤖 Réponse (OpenAI):\n\n${out}` })
    } catch (err) {
      console.error(`OpenAI attempt ${attempt} error:`, err)

      // Extraire info si disponible (OpenAI lib error shape)
      const status = err?.status || err?.response?.status
      const code = err?.code || err?.error?.code || err?.error?.type

      // Si quota insuffisant -> prévenir et arrêter (ne retente pas)
      if (code === 'insufficient_quota' || (err?.error?.type === 'insufficient_quota')) {
        await sock.sendMessage(from, {
          text: '⚠️ OpenAI — quota dépassé / facturation insuffisante. Vérifie ton compte OpenAI et ton plan.'
        })
        return
      }

      // 429 (rate limit) -> retry avec backoff (si on n’a pas atteint maxAttempts)
      if (status === 429 || (code && code.toString().toLowerCase().includes('rate'))) {
        if (attempt >= maxAttempts) {
          await sock.sendMessage(from, { text: '⚠️ Trop de requêtes OpenAI — réessaie plus tard.' })
          return
        }
        const backoffMs = 500 * (2 ** (attempt - 1)) + Math.floor(Math.random()*300)
        console.log(`OpenAI rate limit, retrying in ${backoffMs}ms (attempt ${attempt})`)
        await sleep(backoffMs)
        continue
      }

      // autre erreur -> informer l'utilisateur
      await sock.sendMessage(from, { text: '❗ Erreur OpenAI: ' + (err?.message || 'voir logs serveur') })
      return
    }
  }
}
