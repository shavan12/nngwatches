const fs   = require('fs')
const path = require('path')

const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'nng-data.json')

// Ensure DB directory exists (important for Railway Volume mount paths like /data/)
const dbDir = path.dirname(DB_FILE)
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const DEFAULT = {
  users: [], brands: [], categories: [], products: [],
  product_images: [], orders: [], order_items: [],
  hero_slides: [],
  auctions: [], bids: [], auction_winners: [], auction_images: [],
  notifications: [], notification_dedup: [], notification_preferences: [],
  push_subscriptions: [],
  _counters: { users:0, brands:0, categories:0, products:0, product_images:0, orders:0, order_items:0, hero_slides:0, auctions:0, bids:0, auction_winners:0, auction_images:0, notifications:0, notification_dedup:0, notification_preferences:0, push_subscriptions:0 }
}

const dbExists = fs.existsSync(DB_FILE)
console.log(`📂 DB path: ${DB_FILE} (${dbExists ? 'FOUND — loading existing data' : 'NOT FOUND — starting fresh'})`)

let state = dbExists
  ? (() => { try {
      const d = JSON.parse(fs.readFileSync(DB_FILE,'utf8'))
      if (!d.hero_slides) { d.hero_slides = []; d._counters.hero_slides = 0 }
      if (!d.auctions) { d.auctions = []; d._counters.auctions = 0 }
      if (!d.bids) { d.bids = []; d._counters.bids = 0 }
      if (!d.auction_winners) { d.auction_winners = []; d._counters.auction_winners = 0 }
      if (!d.auction_images) { d.auction_images = []; d._counters.auction_images = 0 }
      if (!d.notifications) { d.notifications = []; d._counters.notifications = 0 }
      if (!d.notification_dedup) { d.notification_dedup = []; d._counters.notification_dedup = 0 }
      if (!d.notification_preferences) { d.notification_preferences = []; d._counters.notification_preferences = 0 }
      if (!d.push_subscriptions) { d.push_subscriptions = []; d._counters.push_subscriptions = 0 }
      return d
    } catch(e) { console.error('⚠️ Failed to parse DB file, starting fresh:', e.message); return {...DEFAULT} } })()
  : {...DEFAULT}

function save() { fs.writeFileSync(DB_FILE, JSON.stringify(state,null,2),'utf8') }

function nextId(table) {
  state._counters[table] = (state._counters[table]||0)+1
  return state._counters[table]
}

const now = () => new Date().toISOString().replace('T',' ').split('.')[0]

const db = {
  all(table, filter={}) {
    return (state[table]||[]).filter(r => Object.entries(filter).every(([k,v]) => r[k]==v))
  },
  get(table, filter={}) {
    return (state[table]||[]).find(r => Object.entries(filter).every(([k,v]) => r[k]==v)) || null
  },
  byId(table, id) { return (state[table]||[]).find(r=>r.id==id)||null },
  insert(table, data) {
    const row = { id:nextId(table), ...data, created_at:now() }
    if (['products','orders'].includes(table)) row.updated_at = now()
    state[table].push(row); save(); return row
  },
  update(table, id, data) {
    const i = state[table].findIndex(r=>r.id==id)
    if (i===-1) return null
    state[table][i] = {...state[table][i], ...data, updated_at:now()}
    save(); return state[table][i]
  },
  delete(table, id) {
    const before = state[table].length
    state[table] = state[table].filter(r=>r.id!=id)
    save(); return state[table].length < before
  },
  deleteWhere(table, filter={}) {
    state[table] = state[table].filter(r=>!Object.entries(filter).every(([k,v])=>r[k]==v))
    save()
  },
  count(table, filter={}) { return db.all(table,filter).length },
  sum(table, field, filter={}) { return db.all(table,filter).reduce((s,r)=>s+(Number(r[field])||0),0) },
  state,
}

module.exports = db
