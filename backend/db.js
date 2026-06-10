const fs   = require('fs')
const path = require('path')

const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'nng-data.json')
const DEFAULT = {
  users: [], brands: [], categories: [], products: [],
  product_images: [], orders: [], order_items: [],
  hero_slides: [],
  _counters: { users:0, brands:0, categories:0, products:0, product_images:0, orders:0, order_items:0, hero_slides:0 }
}

let state = fs.existsSync(DB_FILE)
  ? (() => { try { const d = JSON.parse(fs.readFileSync(DB_FILE,'utf8')); if (!d.hero_slides) { d.hero_slides = []; d._counters.hero_slides = 0 } return d } catch { return {...DEFAULT} } })()
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
