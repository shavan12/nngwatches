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

// Save a push subscription for a user
function saveSubscription(userId, subscription) {
  // Remove any existing subscription with the same endpoint for this user
  const existing = db.get('push_subscriptions', { user_id: userId, endpoint: subscription.endpoint })
  if (existing) {
    db.update('push_subscriptions', existing.id, {
      keys_p256dh: subscription.keys.p256dh,
      keys_auth: subscription.keys.auth,
    })
    return existing
  }

  return db.insert('push_subscriptions', {
    user_id: userId,
    endpoint: subscription.endpoint,
    keys_p256dh: subscription.keys.p256dh,
    keys_auth: subscription.keys.auth,
  })
}

// Remove a push subscription
function removeSubscription(userId, endpoint) {
  const sub = db.get('push_subscriptions', { user_id: userId, endpoint })
  if (sub) {
    db.delete('push_subscriptions', sub.id)
    return true
  }
  return false
}

// Send a push notification to a specific user
async function sendToUser(userId, { title, body, icon, image, url, tag, notificationId }) {
  const subscriptions = db.all('push_subscriptions', { user_id: userId })
  if (subscriptions.length === 0) return

  const payload = JSON.stringify({
    title: title || 'NNG Watches',
    body: body || '',
    icon: icon || '/NG.webp',
    image: image || undefined,
    url: url || '/',
    tag: tag || `nng-${notificationId || Date.now()}`,
    notificationId,
    timestamp: Date.now(),
  })

  const deadSubs = []

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
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired or invalid — remove it
        deadSubs.push(sub.id)
      }
      // Silently ignore other push errors (network issues etc)
    }
  }

  // Clean up dead subscriptions
  for (const id of deadSubs) {
    db.delete('push_subscriptions', id)
  }
}

// Send push to multiple users
async function sendToUsers(userIds, data) {
  for (const uid of userIds) {
    await sendToUser(uid, data)
  }
}

module.exports = { init, getPublicKey, saveSubscription, removeSubscription, sendToUser, sendToUsers }
