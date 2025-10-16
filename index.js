// index.js — Erwin-Bot : version robuste avec sécurité rate-limits
import dotenv from 'dotenv'
dotenv.config()

import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import https from 'https'
import chalk from 'chalk'
import figlet from 'figlet'
import P from 'pino'

// --- import utils sécurisés ---
import { checkUserRate, checkCooldown, checkGroupTagCooldown, canSend, recordSend, registerJoin } from './utils/rateLimiter.js'

// --- chemins ---
const __dirname = process.cwd()
const authDir = path.join(__dirname, 'auth_info')

// --- helpers ---
const sleep = (ms) => new Promise(res => setTimeout(res, ms))
const rand = (n) => Math.floor(Math.random() * n)

function header() {
  console.clear()
  console.log(chalk.cyan(figlet.textSync('Erwin-Bot', { horizontalLayout: 'full' })))
  console.log(chalk.gray('by ') + chalk.magenta('FUDJING Manuel Erwin'))
  console.log(chalk.gray('────────────────────────────────────────────────────'))
}

function checkNetworkTimeout(url = 'https://web.whatsapp.com', timeout = 3000) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      res.resume()
      resolve({ ok: true, statusCode: res.statusCode })
    })
    req.on('error', (err) => resolve({ ok: false, err: err.message }))
    req.setTimeout(timeout, () => {
      req.destroy()
      resolve({ ok: false, err: 'timeout' })
    })
  })
}

// --- loader tolerant: retourne Map(name -> moduleOrFunction) ---
async function loadCommands() {
  const map = new Map()
  const cmdDir = path.join(__dirname, 'commands')
  if (!fs.existsSync(cmdDir)) return map
  const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))
  for (const f of files) {
    try {
      const mod = await import(path.join(cmdDir, f))
      const def = mod?.default
      if (!def) {
        console.warn(`loadCommands: ${f} n'a pas d'export default, ignoré`)
        continue
      }
      map.set(f.replace('.js',''), def)
    } catch (err) {
      console.error(`loadCommands error importing ${f}: ${err?.message || err}`)
    }
  }
  return map
}

function replyWithTagFactory(sock){
  return async (remoteJid, msg, text) => {
    try { await sock.sendMessage(remoteJid, { text }, { quoted: msg }) } 
    catch (e) { console.error('replyWithTag error', e) }
  }
}

async function start() {
  header()
  const net = await checkNetworkTimeout()
  if (!net.ok) console.log(chalk.red('⚠️  Vérification réseau échouée :'), net.err)
  else console.log(chalk.green(`🌐 Réseau OK (HTTP ${net.statusCode})`))

  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  let version
  try {
    const fetched = await fetchLatestBaileysVersion()
    version = fetched.version
    console.log(chalk.gray('ℹ️  Protocol version fetched:'), version)
  } catch {
    console.log(chalk.yellow('⚠️  Impossible de récupérer la version — valeur par défaut utilisée.'))
  }

  const commands = await loadCommands()
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const logger = P({ level: 'info' })
  let reconnectAttempts = 0
  let creating = false

  async function createSocket() {
    if (creating) return
    creating = true

    const delay = reconnectAttempts === 0 ? 0 : Math.min(1000 * 2 ** reconnectAttempts, 60000) + rand(500)
    if (delay > 0) {
      console.log(chalk.yellow(`⏱ tentative de reconnexion #${reconnectAttempts} dans ${delay}ms`))
      await sleep(delay)
    }

    try {
      const sock = makeWASocket({
        logger,
        printQRInTerminal: false,
        auth: state,
        version,
        browser: ['Erwin-Bot', 'NodeJS-Terminal', '1.0.0']
      })

      sock.ev.on('creds.update', saveCreds)

      sock.ev.on('connection.update', async (upd) => {
        const { connection, lastDisconnect, qr } = upd
        if (qr) { 
          console.log(chalk.green('\n[🔑] QR code généré — scanne-le :'))
          qrcode.generate(qr, { small: true })
        }
        if (connection === 'open') {
          reconnectAttempts = 0
          console.log(chalk.green('✅ Connecté à WhatsApp.'))
        }
        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode
          console.log(chalk.red(`❌ Connexion fermée (${statusCode || 'Unknown'})`))
          if (statusCode === 401) {
            fs.rmSync(authDir, { recursive: true, force: true })
            fs.mkdirSync(authDir, { recursive: true })
            reconnectAttempts = 0
            creating = false
            await start()
            return
          }
          reconnectAttempts++
          creating = false
          await createSocket()
        }
      })

      // --- message handler ---
      sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages?.[0]
        if (!msg || !msg.message) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        if (!text.startsWith('.')) return

        const [cmdRaw, ...args] = text.slice(1).split(/\s+/)
        const cmd = cmdRaw.toLowerCase()
        const sender = msg.key.participant || from

        // --- Vérif anti-spam ---
        if (!canSend(sender)) {
          await sock.sendMessage(from, { text: '⏳ Calme un peu ! Réessaie dans quelques secondes.' }, { quoted: msg })
          return
        }

        recordSend(sender)

        // --- Commande normale (y compris menu.js) ---
        const commandFunc = commands.get(cmd)
        if (!commandFunc) {
          await sock.sendMessage(from, { text: '❌ Commande inconnue. Tape .menu pour voir la liste.' }, { quoted: msg })
          return
        }

        try {
          await commandFunc(sock, msg, args)
        } catch (err) {
          console.error(`Erreur commande ${cmd}:`, err)
          await sock.sendMessage(from, { text: `⚠️ Une erreur est survenue : ${err.message}` }, { quoted: msg })
        }
      })

      creating = false
      reconnectAttempts = 0
      return sock
    } catch (err) {
      creating = false
      reconnectAttempts++
      console.error('createSocket error', err?.message || err)
      const wait = Math.min(1000 * (2 ** reconnectAttempts), 60000) + rand(500)
      console.log(chalk.yellow(`⏱ Nouvelle tentative dans ${wait}ms`))
      await sleep(wait)
      return createSocket()
    }
  }

  try { await createSocket() } 
  catch (e) { console.error('Erreur createSocket', e) }

  process.on('uncaughtException', (err) => console.error('uncaughtException', err))
  process.on('unhandledRejection', (err) => console.error('unhandledRejection', err))
}

start().catch(err => console.error('start() failed', err))
