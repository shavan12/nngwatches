const webPush = require('web-push')
const fs = require('fs')
const path = require('path')
const db = require('./db')

const VAPID_FILE = process.env.VAPID_PATH || path.join(__dirname, 'vapid-keys.json')

let vapidKeys = null

// Initialize VAPID keys — generate once and save to file
function init() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    }
  } else if (fs.existsSync(VAPID_FILE)) {
    try {
      vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'))
    } catch (e) {
      console.error('⚠️ Failed to read VAPID keys, generating new ones')
      vapidKeys = null
    }
  }

  if (!vapidKeys) {
    vapidKeys = webPush.generateVAPIDKeys()
    try {
      fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf8')
      console.log('🔑 Generated new VAPID keys → ' + VAPID_FILE)
    } catch (e) {
      console.error('⚠️ Could not save VAPID keys to file:', e.message)
    }
  }

  const contactEmail = process.env.VAPID_EMAIL || 'mailto:admin@nng.com'
  webPush.setVapidDetails(contactEmail, vapidKeys.publicKey, vapidKeys.privateKey)
  console.log('🔔 Web Push initialized (VAPID public key: ' + vapidKeys.publicKey.substring(0, 20) + '...)')
}

// Get public key (needed by frontend)
function getPublicKey() {
  return vapidKeys ? vapidKeys.publicKey : null
}

// Save a push subscription for a user (supports multiple devices: iPhone, Android, Desktop)
function saveSubscription(userId, subscription, { platform = 'desktop', userAgent = '' } = {}) {
  const endpoint = subscription.endpoint
  const p256dh = subscription.keys?.p256dh || ''
  const auth = subscription.keys?.auth || ''

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid subscription object: missing endpoint or keys')
  }

  // Detect platform if not provided
  let detectedPlatform = platform
  if (!detectedPlatform || detectedPlatform === 'desktop') {
    if (/iPad|iPhone|iPod/.test(userAgent)) detectedPlatform = 'ios'
    else if (/Android/.test(userAgent)) detectedPlatform = 'android'
    else if (/Macintosh|Mac OS X/.test(userAgent)) detectedPlatform = 'macos'
    else if (/Windows/.test(userAgent)) detectedPlatform = 'windows'
  }

  // Check if this specific endpoint is already registered
  const existing = db.get('push_subscriptions', { endpoint })
  if (existing) {
    db.update('push_subscriptions', existing.id, {
      user_id: userId,
      keys_p256dh: p256dh,
      keys_auth: auth,
      platform: detectedPlatform,
      user_agent: userAgent ? userAgent.substring(0, 250) : (existing.user_agent || ''),
      active: 1,
      updated_at: new Date().toISOString()
    })
    console.log(`📱 Push subscription updated for user ${userId} (${detectedPlatform})`)
    return db.byId('push_subscriptions', existing.id)
  }

  const newSub = db.insert('push_subscriptions', {
    user_id: userId,
    endpoint,
    keys_p256dh: p256dh,
    keys_auth: auth,
    platform: detectedPlatform,
    user_agent: userAgent ? userAgent.substring(0, 250) : '',
    active: 1
  })
  console.log(`📱 New push subscription saved for user ${userId} (${detectedPlatform})`)
  return newSub
}

// Remove a push subscription
function removeSubscription(userId, endpoint) {
  const sub = db.get('push_subscriptions', { user_id: userId, endpoint })
  if (sub) {
    db.delete('push_subscriptions', sub.id)
    console.log(`📱 Push subscription removed for user ${userId}`)
    return true
  }
  return false
}

// Send a push notification to a specific user across all their registered devices (iPhone, Android, Desktop)
async function sendToUser(userId, { title, body, icon, image, url, tag, notificationId }) {
  const subscriptions = db.all('push_subscriptions', { user_id: userId })
  if (subscriptions.length === 0) return { sent: 0, dead: 0, platforms: [] }

  const payload = JSON.stringify({
    title: title || 'NNG Watches',
    body: body || '',
    icon: icon || '/NNGF.png',
    badge: '/NNGF.png',
    image: image || undefined,
    url: url || '/',
    tag: tag || `nng-${notificationId || Date.now()}`,
    notificationId,
    timestamp: Date.now(),
  })

  const deadSubs = []
  let sentCount = 0
  const activePlatforms = []

  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys_p256dh,
        auth: sub.keys_auth,
      },
    }

    try {
      await webPush.sendNotification(pushSub, payload)
      sentCount++
      if (sub.platform && !activePlatforms.includes(sub.platform)) {
        activePlatforms.push(sub.platform)
      }
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired or invalid (e.g. uninstalled or reset) — remove it
        deadSubs.push(sub.id)
      } else {
        console.warn(`⚠️ Push delivery notice for user ${userId} (${sub.platform || 'unknown'}):`, err.message || err)
      }
    }
  }

  // Clean up dead subscriptions
  for (const id of deadSubs) {
    db.delete('push_subscriptions', id)
  }

  return { sent: sentCount, dead: deadSubs.length, platforms: activePlatforms }
}

// Send push to multiple users
async function sendToUsers(userIds, data) {
  const results = []
  for (const uid of userIds) {
    const r = await sendToUser(uid, data)
    results.push({ userId: uid, ...r })
  }
  return results
}

module.exports = { init, getPublicKey, saveSubscription, removeSubscription, sendToUser, sendToUsers }
