const db = require('./db')

let sse = null
let push = null

const TYPES = {
  NEW_AUCTION: 'NEW_AUCTION',
  UPCOMING_AUCTION: 'UPCOMING_AUCTION',
  AUCTION_STARTED: 'AUCTION_STARTED',
  NEW_BID: 'NEW_BID',
  OUTBID: 'OUTBID',
  AUCTION_ENDING: 'AUCTION_ENDING',
  AUCTION_ENDED: 'AUCTION_ENDED',
  AUCTION_WON: 'AUCTION_WON',
  AUCTION_LOST: 'AUCTION_LOST',
  ADMIN_NEW_BID: 'ADMIN_NEW_BID',
  ADMIN_AUCTION_STARTED: 'ADMIN_AUCTION_STARTED',
  ADMIN_AUCTION_ENDED: 'ADMIN_AUCTION_ENDED',
  SYSTEM: 'SYSTEM',
}

// Types that cannot be disabled by user preferences
const MANDATORY_TYPES = [TYPES.AUCTION_WON, TYPES.AUCTION_LOST, TYPES.OUTBID]

// Map notification types to preference keys
const PREF_MAP = {
  [TYPES.NEW_AUCTION]: 'new_auctions',
  [TYPES.UPCOMING_AUCTION]: 'upcoming_auctions',
  [TYPES.AUCTION_STARTED]: 'auction_started',
  [TYPES.NEW_BID]: 'new_bids',
  [TYPES.OUTBID]: 'outbid',
  [TYPES.AUCTION_ENDING]: 'auction_ending',
  [TYPES.AUCTION_ENDED]: 'auction_results',
  [TYPES.AUCTION_WON]: 'auction_results',
  [TYPES.AUCTION_LOST]: 'auction_results',
}

const DEFAULT_PREFERENCES = {
  new_auctions: 1,
  upcoming_auctions: 1,
  auction_started: 1,
  new_bids: 1,
  outbid: 1,
  auction_ending: 1,
  auction_results: 1,
}

function init(sseManager, pushService) {
  sse = sseManager
  push = pushService || null
}

// Check if a notification is a duplicate
function isDuplicate(userId, type, auctionId, dedupKey) {
  const filter = { user_id: userId, type, auction_id: auctionId || 0 }
  if (dedupKey) filter.dedup_key = dedupKey
  return !!db.get('notification_dedup', filter)
}

// Record a dedup entry
function recordDedup(userId, type, auctionId, dedupKey) {
  db.insert('notification_dedup', {
    user_id: userId,
    type,
    auction_id: auctionId || 0,
    dedup_key: dedupKey || '',
  })
}

// Check if user has this notification type enabled
function isEnabled(userId, type) {
  if (MANDATORY_TYPES.includes(type)) return true
  const prefKey = PREF_MAP[type]
  if (!prefKey) return true
  const pref = db.get('notification_preferences', { user_id: userId })
  if (!pref) return true // defaults are all enabled
  return pref[prefKey] !== 0
}

// Create a single notification for one user
function create(userId, type, { auctionId = null, title, message, imageUrl = '', actionUrl = '', dedupKey = '', title_ar = '', message_ar = '' } = {}) {
  if (!userId || !type || !title) return null
  // Check preferences
  if (!isEnabled(userId, type)) return null
  // Check dedup
  if (isDuplicate(userId, type, auctionId, dedupKey)) return null
  
  const notification = db.insert('notifications', {
    user_id: userId,
    type,
    auction_id: auctionId || 0,
    title,
    message: message || '',
    title_ar: title_ar || '',
    message_ar: message_ar || '',
    image_url: imageUrl || '',
    action_url: actionUrl || '',
    is_read: 0,
  })
  
  // Record dedup
  recordDedup(userId, type, auctionId, dedupKey)
  
  // Push via SSE
  if (sse) {
    sse.sendToUser(userId, 'notification', notification)
  }
  
  // Push via Web Push (native device notifications)
  if (push) {
    push.sendToUser(userId, {
      title,
      body: message || '',
      image: imageUrl || undefined,
      url: actionUrl || '/',
      tag: `${type}-${auctionId || notification.id}`,
      notificationId: notification.id,
    }).catch(() => {}) // fire and forget
  }
  
  return notification
}

// Create notifications for all registered customers
function createForAllUsers(type, data) {
  const users = db.all('users').filter(u => u.role === 'customer')
  const results = []
  for (const u of users) {
    const n = create(u.id, type, data)
    if (n) results.push(n)
  }
  return results
}

// Create notifications for all participants in an auction (users who have bid)
function createForParticipants(auctionId, type, data, excludeUserId = null) {
  const bids = db.all('bids', { auction_id: auctionId })
  const participantIds = [...new Set(bids.map(b => b.user_id))]
  const results = []
  for (const uid of participantIds) {
    if (uid === excludeUserId) continue
    // For admin users (id=1 with local-admin-token), skip participant notifications
    const user = db.byId('users', uid)
    if (!user || user.role === 'admin') continue
    const n = create(uid, type, { ...data, auctionId })
    if (n) results.push(n)
  }
  return results
}

// Create admin-only notification (with deduplication)
function createAdminNotification(type, { auctionId = null, title, message, imageUrl = '', actionUrl = '', dedupKey = '', title_ar = '', message_ar = '' } = {}) {
  const admins = db.all('users').filter(u => u.role === 'admin')
  const results = []
  for (const a of admins) {
    if (isDuplicate(a.id, type, auctionId, dedupKey)) continue
    const n = db.insert('notifications', {
      user_id: a.id,
      type,
      auction_id: auctionId || 0,
      title,
      message: message || '',
      title_ar: title_ar || '',
      message_ar: message_ar || '',
      image_url: imageUrl || '',
      action_url: actionUrl || '',
      is_read: 0,
    })
    recordDedup(a.id, type, auctionId, dedupKey)
    if (sse) sse.sendToUser(a.id, 'notification', n)
    if (push) push.sendToUser(a.id, { title, body: message || '', url: actionUrl || '/admin', tag: `admin-${type}-${auctionId||n.id}`, notificationId: n.id }).catch(()=>{})
    results.push(n)
  }
  return results
}

// Helper to check if notification is unread
function isUnread(n) {
  return !n.is_read || n.is_read === 0 || n.is_read === '0' || n.is_read === false
}

// Get notifications for a user
function getUserNotifications(userId, { limit = 30, offset = 0, type = '' } = {}) {
  let list = db.all('notifications').filter(n => n.user_id == userId)
  // Exclude admin types from regular customer view
  list = list.filter(n => !n.type.startsWith('ADMIN_'))
  if (type) {
    // Support type groups
    if (type === 'auctions') {
      list = list.filter(n => [TYPES.NEW_AUCTION, TYPES.UPCOMING_AUCTION, TYPES.AUCTION_STARTED].includes(n.type))
    } else if (type === 'bids') {
      list = list.filter(n => [TYPES.NEW_BID, TYPES.OUTBID].includes(n.type))
    } else if (type === 'results') {
      list = list.filter(n => [TYPES.AUCTION_ENDING, TYPES.AUCTION_ENDED, TYPES.AUCTION_WON, TYPES.AUCTION_LOST].includes(n.type))
    } else {
      list = list.filter(n => n.type === type)
    }
  }
  list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  return { data: list.slice(offset, offset + limit), total: list.length }
}

// Get unread count for a user
function getUnreadCount(userId) {
  const list = db.all('notifications')
    .filter(n => n.user_id == userId && !n.type.startsWith('ADMIN_') && isUnread(n))
  return list.length
}

// Mark a single notification as read (with ownership check)
function markRead(notificationId, userId) {
  const n = db.byId('notifications', notificationId)
  if (!n || n.user_id != userId) return false
  db.update('notifications', notificationId, { is_read: 1 })
  return true
}

// Mark all notifications as read for a user
function markAllRead(userId) {
  const allNotifs = db.all('notifications')
  let count = 0
  for (const n of allNotifs) {
    if (n.user_id == userId && isUnread(n)) {
      n.is_read = 1
      n.updated_at = new Date().toISOString()
      count++
    }
  }
  if (count > 0 && db.save) {
    db.save()
  }
  return count
}

// Delete a notification (with ownership check)
function deleteNotification(notificationId, userId) {
  const n = db.byId('notifications', notificationId)
  if (!n || n.user_id != userId) return false
  db.delete('notifications', notificationId)
  return true
}

// Get admin notifications
function getAdminNotifications(userId, { limit = 30, offset = 0 } = {}) {
  let list = db.all('notifications')
    .filter(n => n.user_id == userId && n.type.startsWith('ADMIN_'))
  list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  return { data: list.slice(offset, offset + limit), total: list.length }
}

// Clear all admin notifications
function clearAllAdminNotifications(userId) {
  const adminNotifs = db.all('notifications').filter(n => n.user_id == userId && n.type.startsWith('ADMIN_'))
  for (const n of adminNotifs) {
    db.delete('notifications', n.id)
  }
  return adminNotifs.length
}

// Get user notification preferences
function getPreferences(userId) {
  const pref = db.get('notification_preferences', { user_id: userId })
  if (!pref) return { user_id: userId, ...DEFAULT_PREFERENCES }
  return pref
}

// Update user notification preferences
function updatePreferences(userId, prefs) {
  const existing = db.get('notification_preferences', { user_id: userId })
  const allowed = Object.keys(DEFAULT_PREFERENCES)
  const updates = {}
  for (const key of allowed) {
    if (prefs[key] !== undefined) updates[key] = prefs[key] ? 1 : 0
  }
  if (existing) {
    return db.update('notification_preferences', existing.id, updates)
  } else {
    return db.insert('notification_preferences', { user_id: userId, ...DEFAULT_PREFERENCES, ...updates })
  }
}

// Get participants for an auction
function getAuctionParticipants(auctionId) {
  const bids = db.all('bids', { auction_id: auctionId })
  const userIds = [...new Set(bids.map(b => b.user_id))]
  return userIds.map(uid => {
    const user = db.byId('users', uid)
    const userBids = bids.filter(b => b.user_id === uid)
    const highestBid = Math.max(...userBids.map(b => b.amount))
    return {
      user_id: uid,
      user_name: user?.name || userBids[0]?.user_name || 'Unknown',
      bid_count: userBids.length,
      highest_bid: highestBid,
    }
  })
}

// Clear dedup entries for an auction (used when auction dates change)
function clearAuctionDedup(auctionId, typePrefix = '') {
  const dedups = db.all('notification_dedup', { auction_id: auctionId })
  for (const d of dedups) {
    if (!typePrefix || d.type.startsWith(typePrefix)) {
      db.delete('notification_dedup', d.id)
    }
  }
}

// Clean up all notifications for a deleted auction
function cleanupAuction(auctionId) {
  db.deleteWhere('notifications', { auction_id: auctionId })
  db.deleteWhere('notification_dedup', { auction_id: auctionId })
}

module.exports = {
  TYPES,
  init,
  create,
  createForAllUsers,
  createForParticipants,
  createAdminNotification,
  getUserNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  getAdminNotifications,
  clearAllAdminNotifications,
  getPreferences,
  updatePreferences,
  getAuctionParticipants,
  clearAuctionDedup,
  cleanupAuction,
}
