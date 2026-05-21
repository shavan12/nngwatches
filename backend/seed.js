const bcrypt = require('bcryptjs')
const db     = require('./db')

console.log('🌱 Seeding NNG database...')

// Clear existing data
db.state.users          = []
db.state.brands         = []
db.state.categories     = []
db.state.products       = []
db.state.product_images = []
db.state.orders         = []
db.state.order_items    = []
db.state.hero_slides    = []
db.state._counters      = { users:0, brands:0, categories:0, products:0, product_images:0, orders:0, order_items:0, hero_slides:0 }

const fs   = require('fs')
const path = require('path')
fs.writeFileSync(path.join(__dirname,'nng-data.json'), JSON.stringify(db.state,null,2))

// Admin user
db.insert('users', { name:'Admin NNG', email:'admin@nng.com', password: bcrypt.hashSync('admin123',10), role:'admin', phone:'' })

// Brands
const brandData = [
  { name:'Rolex',              founded:1905, origin:'Switzerland', description:"The world's most recognized luxury watch brand." },
  { name:'Audemars Piguet',    founded:1875, origin:'Switzerland', description:'Creator of the iconic Royal Oak.' },
  { name:'Patek Philippe',     founded:1839, origin:'Switzerland', description:'The last independent family-owned Genevan manufacturer.' },
  { name:'Cartier',            founded:1847, origin:'France',      description:'Maison Cartier brings jewelry artistry to watchmaking.' },
  { name:'Omega',              founded:1848, origin:'Switzerland', description:'Official timekeeper of the Olympics.' },
  { name:'IWC',                founded:1868, origin:'Switzerland', description:'Renowned for aviation watches and engineering.' },
  { name:'Vacheron Constantin',founded:1755, origin:'Switzerland', description:'One of the oldest watch manufacturers.' },
  { name:'A. Lange & Söhne',   founded:1845, origin:'Germany',    description:"Germany's finest watchmaker." },
  { name:'Hublot',             founded:1980, origin:'Switzerland', description:'The Art of Fusion – tradition meets innovation.' },
]
brandData.forEach(b => db.insert('brands', b))

// Categories
const catData = [
  { slug:'dress',   name_en:'Dress Watches',  name_ar:'ساعات رسمية'  },
  { slug:'sport',   name_en:'Sport Watches',  name_ar:'ساعات رياضية' },
  { slug:'diver',   name_en:'Diver Watches',  name_ar:'ساعات الغوص'  },
  { slug:'pilot',   name_en:'Pilot Watches',  name_ar:'ساعات الطيار' },
  { slug:'vintage', name_en:'Vintage',        name_ar:'كلاسيكية'     },
]
catData.forEach(c => db.insert('categories', c))

// Products
const products = [
  ['Submariner Date',         1,3,12500,null,   '126610LN','Automatic','Oystersteel',    '41mm','300m',"The Submariner is the reference among divers' watches.",1,1,1,4.9,124],
  ['Royal Oak',               2,2,32000,38000,  '15400ST', 'Automatic','Stainless Steel','41mm','50m', 'Created by legendary designer Gérald Genta.',          1,0,1,4.8,89],
  ['Nautilus',                3,1,85000,null,   '5711/1A', 'Automatic','Stainless Steel','40mm','120m','Conceived by Gérald Genta in 1976.',                   0,0,1,5.0,67],
  ['Daytona',                 1,2,18000,null,   '116500LN','Automatic','Oystersteel',    '40mm','100m','Designed for professional racing drivers.',             1,0,1,4.9,203],
  ['Santos de Cartier',       4,4,9800, 11000,  'WSSA0009','Automatic','Steel & Gold',   '39.8mm','100m','Created by Louis Cartier in 1904.',                  1,1,0,4.7,55],
  ['Speedmaster Professional',5,2,7200, null,   '310.30.42','Manual',  'Stainless Steel','42mm','50m', 'The Moonwatch – since 1969.',                          1,0,1,4.8,342],
  ['Portugieser Chronograph', 6,1,14500,null,   'IW371447','Automatic','Stainless Steel','41mm','30m', 'Elegant aesthetics with precise chronograph function.', 1,0,0,4.6,41],
  ['Overseas',                7,2,28000,31000,  '4500V/110','Automatic','Stainless Steel','41mm','150m','The archetype of the sports watch since 1996.',        1,1,0,4.9,28],
  ['Perpetual Calendar',      8,1,72000,null,   '130.032', 'Manual',   'Pink Gold',      '41.9mm','none','One of the most complicated Lange watches.',          0,0,0,5.0,12],
  ["Pilot's Watch Mark XVIII",6,4,5400, null,   'IW327001','Automatic','Stainless Steel','40mm','60m', 'Designed for clarity in the cockpit.',                  1,0,0,4.5,78],
  ['Seamaster Aqua Terra',    5,3,6100, 6800,   '220.10.38','Automatic','Stainless Steel','38mm','150m','The most versatile Seamaster.',                        1,0,0,4.7,96],
  ['Big Bang',                9,2,21000,null,   '441.NX',  'Automatic','Titanium',       '44mm','100m',"Hublot's flagship. Art of Fusion.",                    1,1,0,4.6,63],
]

const imgMap = {
  1:['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80','https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600&q=80','https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80'],
  2:['https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80','https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=600&q=80'],
  3:['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&q=80','https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80'],
  4:['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80','https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=600&q=80'],
  5:['https://images.unsplash.com/photo-1550029402-226115b7f9e6?w=600&q=80','https://images.unsplash.com/photo-1616117831765-5e6b1a9d0745?w=600&q=80'],
  6:['https://images.unsplash.com/photo-1606744824163-985d376605aa?w=600&q=80','https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&q=80'],
  7:['https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600&q=80','https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=600&q=80'],
  8:['https://images.unsplash.com/photo-1627379327983-1ff2dcd63fbc?w=600&q=80'],
  9:['https://images.unsplash.com/photo-1593050863428-c797c1c74e49?w=600&q=80'],
  10:['https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80','https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&q=80'],
  11:['https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&q=80'],
  12:['https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=600&q=80'],
}

products.forEach(([name,brand_id,cat_id,price,orig,ref,mov,mat,dia,wr,desc,stock,isnew,feat,rating,reviews], i) => {
  const p = db.insert('products', { name, brand_id, category_id:cat_id, price, original_price:orig||null, reference:ref, movement:mov, case_material:mat, diameter:dia, water_resistance:wr, description:desc, in_stock:stock, is_new:isnew, is_featured:feat, rating, reviews_count:reviews })
  ;(imgMap[i+1]||[]).forEach((url,si) => db.insert('product_images', { product_id:p.id, url, sort_order:si }))
})

// Sample orders
const sampleOrders = [
  { num:'ORD-2024-001', name:'Ahmed Al-Rashid', email:'ahmed@email.com', phone:'+971501234567', addr:'123 Palm Jumeirah', city:'Dubai',    country:'UAE',          sub:12500, ship:0, total:12500, status:'delivered', pid:1 },
  { num:'ORD-2024-002', name:'Sarah Johnson',   email:'sarah@email.com', phone:'+12125550100',  addr:'456 Fifth Ave',    city:'New York', country:'USA',          sub:32000, ship:0, total:32000, status:'shipped',   pid:2 },
  { num:'ORD-2024-003', name:'Mohammed Hassan', email:'moh@email.com',   phone:'+96650000000',  addr:'789 King Road',    city:'Riyadh',   country:'Saudi Arabia', sub:18000, ship:0, total:18000, status:'processing',pid:4 },
  { num:'ORD-2024-004', name:'Emma Williams',   email:'emma@email.com',  phone:'+447911123456', addr:'10 Knightsbridge', city:'London',   country:'UK',           sub:9800,  ship:0, total:9800,  status:'pending',   pid:5 },
]
sampleOrders.forEach(o => {
  const order = db.insert('orders', { order_number:o.num, customer_name:o.name, customer_email:o.email, customer_phone:o.phone, shipping_address:o.addr, city:o.city, country:o.country, subtotal:o.sub, shipping:o.ship, total:o.total, status:o.status, notes:'' })
  const prod  = db.byId('products', o.pid)
  const brand = prod ? db.byId('brands', prod.brand_id) : null
  if (prod) db.insert('order_items', { order_id:order.id, product_id:prod.id, product_name:prod.name, brand_name:brand?.name||'', price:o.sub, quantity:1 })
})

// ── Default hero slides ────────────────────────────────
const defaultSlides = [
  {
    title_en: 'Timeless Elegance',
    title_ar: 'أناقة خالدة',
    subtitle_en: "Discover the world's finest luxury timepieces, curated for the discerning collector.",
    subtitle_ar: 'اكتشف أرقى الساعات الفاخرة في العالم، مختارة بعناية لعشاق الجودة.',
    cta_en: 'Explore Collection',
    cta_ar: 'استكشف المجموعة',
    image_url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1400&q=85',
    active: 1,
    sort_order: 1,
  },
  {
    title_en: 'The Art of Time',
    title_ar: 'فن صناعة الوقت',
    subtitle_en: 'From iconic dress watches to legendary sport timepieces — find your perfect expression.',
    subtitle_ar: 'من الساعات الرسمية الأيقونية إلى الرياضية الأسطورية — اعثر على تعبيرك المثالي.',
    cta_en: 'Shop Now',
    cta_ar: 'تسوق الآن',
    image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1400&q=85',
    active: 1,
    sort_order: 2,
  },
  {
    title_en: 'Heritage & Craftsmanship',
    title_ar: 'الإرث والحرفية',
    subtitle_en: 'Every watch tells a story of centuries of horological mastery.',
    subtitle_ar: 'كل ساعة تحكي قصة قرون من الإتقان الساعاتي.',
    cta_en: 'View Brands',
    cta_ar: 'عرض الماركات',
    image_url: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1400&q=85',
    active: 1,
    sort_order: 3,
  },
]
defaultSlides.forEach(s => db.insert('hero_slides', s))

console.log('✅ Done! Database created at backend/nng-data.json')
console.log('   Products:', db.count('products'))
console.log('   Slides:  ', db.count('hero_slides'))
console.log('   Admin:   admin@nng.com / admin123')
