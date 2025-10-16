// utils/rateLimiter.js

// Dictionnaires pour stocker les données des utilisateurs et groupes
const userCooldowns = new Map()
const userRates = new Map()
const groupTagCooldowns = new Map()
const joinedUsers = new Set()

// Vérifie si un utilisateur est en cooldown
export function checkCooldown(userId, cooldownTime = 3000) {
  const now = Date.now()
  const lastAction = userCooldowns.get(userId) || 0
  if (now - lastAction < cooldownTime) {
    return false
  }
  userCooldowns.set(userId, now)
  return true
}

// Vérifie le taux d’envoi de messages pour éviter le spam
export function checkUserRate(userId, maxMessages = 5, interval = 10000) {
  const now = Date.now()
  if (!userRates.has(userId)) {
    userRates.set(userId, [])
  }

  const timestamps = userRates.get(userId)
  const recent = timestamps.filter(t => now - t < interval)
  recent.push(now)
  userRates.set(userId, recent)

  return recent.length <= maxMessages
}

// ✅ Vérifie si un groupe peut être tagué (anti-abus de mentions @everyone)
export function checkGroupTagCooldown(groupId, cooldownTime = 60000) {
  const now = Date.now()
  const lastTag = groupTagCooldowns.get(groupId) || 0
  if (now - lastTag < cooldownTime) {
    return false // cooldown encore actif
  }
  groupTagCooldowns.set(groupId, now)
  return true
}

// Combine les deux vérifications pour savoir si un utilisateur peut envoyer
export function canSend(userId) {
  return checkCooldown(userId) && checkUserRate(userId)
}

// Enregistre un envoi de message pour l’utilisateur
export function recordSend(userId) {
  const now = Date.now()
  if (!userRates.has(userId)) {
    userRates.set(userId, [])
  }
  userRates.get(userId).push(now)
  userCooldowns.set(userId, now)
}

// Enregistre qu’un utilisateur a rejoint
export function registerJoin(userId) {
  if (joinedUsers.has(userId)) return false
  joinedUsers.add(userId)
  return true
}
