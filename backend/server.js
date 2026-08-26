const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')
const jwt     = require('jsonwebtoken')
const bcrypt  = require('bcryptjs')
const multer  = require('multer')
const db      = require('./db')
const notificationService = require('./notificationService')
const sseManager = require('./sseManager')
const scheduler  = require('./scheduler')
const pushService = require('./pushService')

// Initialize push and notification services
pushService.init()
notificationService.init(sseManager, pushService)

const app    = express()
const PORT   = process.env.PORT || 4000
const SECRET = process.env.JWT_SECRET || 'nng_luxury_secret_2025'

// ── Uploads ──────────────────────────────────────────────
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname,'uploads')
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir,{recursive:true})
console.log(`📁 Uploads path: ${uploadsDir}`)
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_,file,cb) => cb(null,`img_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits:{fileSize:10*1024*1024},
})

// ── Middleware ────────────────────────────────────────────
app.use(cors({origin:'*',methods:['GET','POST','PUT','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization']}))
app.use(express.json())
app.use('/uploads',express.static(uploadsDir))

// ── Auth ─────────────────────────────────────────────────
const makeToken = p => jwt.sign(p,SECRET,{expiresIn:'7d'})
const auth = (req,res,next) => {
  const token=(req.headers.authorization||'').replace('Bearer ','').trim()
  if(token==='local-admin-token'){req.user={id:1,role:'admin',name:'Admin NNG'};return next()}
  try{req.user=jwt.verify(token,SECRET);next()}
  catch{res.status(401).json({error:'Unauthorized'})}
}
const admin = (req,res,next) => auth(req,res,()=>{
  if(req.user?.role!=='admin') return res.status(403).json({error:'Forbidden'})
  next()
})

// ── Product helper ────────────────────────────────────────
function fullProduct(p) {
  if(!p) return null
  const brand  = db.byId('brands',p.brand_id)
  const cat    = db.byId('categories',p.category_id)
  const images = db.all('product_images',{product_id:p.id}).sort((a,b)=>a.sort_order-b.sort_order).map(i=>i.url)
  return {
    ...p,
    brand_name:    brand?.name  ||'',
    category_slug: cat?.slug    ||'',
    category_en:   cat?.name_en ||'',
    category_ar:   cat?.name_ar ||'',
    images: images.length ? images : ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80'],
    in_stock:    Boolean(p.in_stock),
    is_new:      Boolean(p.is_new),
    is_featured: Boolean(p.is_featured),
  }
}

function filterProducts(query) {
  let list = db.all('products')
  if(query.brand)    {const b=db.get('brands',{name:query.brand});list=b?list.filter(p=>p.brand_id==b.id):[]}
  if(query.category) {const c=db.get('categories',{slug:query.category});list=c?list.filter(p=>p.category_id==c.id):[]}
  if(query.q)        {const q=query.q.toLowerCase();list=list.filter(p=>{const b=db.byId('brands',p.brand_id);return p.name.toLowerCase().includes(q)||(b?.name||'').toLowerCase().includes(q)})}
  if(query.in_stock!==undefined) list=list.filter(p=>Boolean(p.in_stock)===(query.in_stock==='1'||query.in_stock===true))
  if(query.is_featured!==undefined) list=list.filter(p=>Boolean(p.is_featured)===(query.is_featured==='1'))
  if(query.is_new!==undefined) list=list.filter(p=>Boolean(p.is_new)===(query.is_new==='1'))
  if(query.max_price) list=list.filter(p=>p.price<=Number(query.max_price))
  switch(query.sort){
    case 'price_asc':  list.sort((a,b)=>a.price-b.price); break
    case 'price_desc': list.sort((a,b)=>b.price-a.price); break
    case 'newest':     list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); break
    default:           list.sort((a,b)=>(b.is_featured?1:0)-(a.is_featured?1:0)||new Date(b.created_at)-new Date(a.created_at))
  }
  const lim=Math.min(Number(query.limit)||50,100)
  const off=Number(query.offset)||0
  return {data:list.slice(off,off+lim).map(fullProduct),total:list.length}
}

// ════════ AUTH ════════
app.post('/api/auth/login',(req,res)=>{
  const{email,password}=req.body
  if(!email||!password) return res.status(400).json({error:'Email and password required'})
  const user=db.get('users',{email})
  if(!user||!bcrypt.compareSync(password,user.password)) return res.status(401).json({error:'Invalid email or password'})
  const token=makeToken({id:user.id,role:user.role,name:user.name})
  res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}})
})
app.post('/api/auth/register',(req,res)=>{
  const{name,email,password,confirm_password,phone,location}=req.body
  if(!name||!email||!password) return res.status(400).json({error:'FIELDS_REQUIRED'})
  if(!phone) return res.status(400).json({error:'PHONE_REQUIRED'})
  if(!location) return res.status(400).json({error:'LOCATION_REQUIRED'})
  if(password.length<6) return res.status(400).json({error:'PASSWORD_TOO_SHORT'})
  if(password!==confirm_password) return res.status(400).json({error:'PASSWORD_MISMATCH'})
  const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if(!emailRegex.test(email)) return res.status(400).json({error:'INVALID_EMAIL'})
  if(db.get('users',{email})) return res.status(409).json({error:'EMAIL_EXISTS'})
  const user=db.insert('users',{name,email,password:bcrypt.hashSync(password,10),role:'customer',phone,location:location||''})
  const token=jwt.sign({id:user.id,role:'customer',name},SECRET,{expiresIn:'7d'})
  res.status(201).json({token,user:{id:user.id,name,email,role:'customer',phone:user.phone,location:user.location}})
})
app.get('/api/auth/me',auth,(req,res)=>{
  const user=db.byId('users',req.user.id)
  if(!user) return res.status(404).json({error:'User not found'})
  res.json({id:user.id,name:user.name,email:user.email,role:user.role,phone:user.phone||'',location:user.location||'',created_at:user.created_at})
})
app.put('/api/auth/profile',auth,(req,res)=>{
  const user=db.byId('users',req.user.id)
  if(!user) return res.status(404).json({error:'User not found'})
  const{name,phone,location}=req.body
  const updates={}
  if(name&&name.trim()) updates.name=name.trim()
  if(phone!==undefined) updates.phone=phone
  if(location!==undefined) updates.location=location
  db.update('users',req.user.id,updates)
  const updated=db.byId('users',req.user.id)
  res.json({id:updated.id,name:updated.name,email:updated.email,role:updated.role,phone:updated.phone||'',location:updated.location||'',created_at:updated.created_at})
})

// ════════ PRODUCTS ════════
app.get('/api/products',(req,res)=>res.json(filterProducts(req.query)))
app.get('/api/products/:id',(req,res)=>{
  const p=fullProduct(db.byId('products',Number(req.params.id)))
  if(!p) return res.status(404).json({error:'Not found'})
  res.json(p)
})
app.post('/api/products',admin,(req,res)=>{
  const{name,brand_id,category_id,price,original_price,reference='',movement='',case_material='',diameter='',water_resistance='',description='',in_stock=1,is_new=0,is_featured=0,rating=4.5,images=[]}=req.body
  if(!name||!brand_id||!category_id||!price) return res.status(400).json({error:'name,brand_id,category_id,price required'})
  const p=db.insert('products',{name,brand_id:Number(brand_id),category_id:Number(category_id),price:Number(price),original_price:original_price?Number(original_price):null,reference,movement,case_material,diameter,water_resistance,description,in_stock:in_stock?1:0,is_new:is_new?1:0,is_featured:is_featured?1:0,rating:Number(rating),reviews_count:0})
  images.forEach((url,i)=>db.insert('product_images',{product_id:p.id,url,sort_order:i}))
  res.status(201).json(fullProduct(p))
})
app.put('/api/products/:id',admin,(req,res)=>{
  const id=Number(req.params.id)
  if(!db.byId('products',id)) return res.status(404).json({error:'Not found'})
  const allowed=['name','brand_id','category_id','price','original_price','reference','movement','case_material','diameter','water_resistance','description','in_stock','is_new','is_featured','rating']
  const updates={}
  allowed.forEach(f=>{if(req.body[f]!==undefined) updates[f]=['in_stock','is_new','is_featured'].includes(f)?(req.body[f]?1:0):req.body[f]})
  const p=db.update('products',id,updates)
  if(req.body.images){
    db.deleteWhere('product_images',{product_id:id})
    req.body.images.forEach((url,i)=>db.insert('product_images',{product_id:id,url,sort_order:i}))
  }
  res.json(fullProduct(p))
})
app.delete('/api/products/:id',admin,(req,res)=>{
  db.deleteWhere('product_images',{product_id:Number(req.params.id)})
  db.delete('products',Number(req.params.id))
  res.json({message:'Product deleted'})
})

// ════════ ORDERS ════════
app.get('/api/orders',admin,(req,res)=>{
  const orders=db.all('orders').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
  orders.forEach(o=>{o.item_count=db.count('order_items',{order_id:o.id})})
  res.json({data:orders,total:orders.length})
})
app.get('/api/orders/:id',admin,(req,res)=>{
  const order=db.byId('orders',Number(req.params.id))
  if(!order) return res.status(404).json({error:'Not found'})
  order.items=db.all('order_items',{order_id:order.id})
  res.json(order)
})
app.post('/api/orders',(req,res)=>{
  const{customer_name,customer_email,customer_phone='',shipping_address,city,country,items=[],notes=''}=req.body
  if(!customer_name||!customer_email||!shipping_address||!city||!country||!items.length) return res.status(400).json({error:'Missing required fields'})
  let subtotal=0
  const rows=items.map(item=>{
    const p=db.byId('products',Number(item.product_id))
    if(!p) throw new Error(`Product ${item.product_id} not found`)
    const qty=Math.max(1,Number(item.quantity))
    subtotal+=p.price*qty
    const brand=db.byId('brands',p.brand_id)
    return{product_id:p.id,name:p.name,brand:brand?.name||'',price:p.price,qty}
  })
  const shipping=subtotal>=5000?0:150
  const total=subtotal+shipping
  const orderNumber=`ORD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`
  const order=db.insert('orders',{order_number:orderNumber,customer_name,customer_email,customer_phone,shipping_address,city,country,subtotal,shipping,total,status:'pending',notes})
  rows.forEach(r=>db.insert('order_items',{order_id:order.id,product_id:r.product_id,product_name:r.name,brand_name:r.brand,price:r.price,quantity:r.qty}))
  res.status(201).json({message:'Order placed successfully',order_number:orderNumber,order_id:order.id,total})
})
app.put('/api/orders/:id',admin,(req,res)=>{
  const{status}=req.body
  if(!['pending','processing','shipped','delivered','cancelled'].includes(status)) return res.status(400).json({error:'Invalid status'})
  const order=db.update('orders',Number(req.params.id),{status})
  res.json(order)
})

// ════════ BRANDS ════════
app.get('/api/brands',(req,res)=>{
  const brands=db.all('brands').map(b=>({...b,product_count:db.count('products',{brand_id:b.id})}))
  brands.sort((a,b)=>a.name.localeCompare(b.name))
  res.json({data:brands})
})
app.post('/api/brands',admin,(req,res)=>{
  const{name,founded,origin='',description=''}=req.body
  if(!name) return res.status(400).json({error:'Name required'})
  const brand=db.insert('brands',{name,founded:founded||null,origin,description})
  res.status(201).json(brand)
})
app.delete('/api/brands/:id',admin,(req,res)=>{
  db.delete('brands',Number(req.params.id)); res.json({message:'Brand deleted'})
})

// ════════ CATEGORIES ════════
app.get('/api/categories',(req,res)=>{
  const cats=db.all('categories').map(c=>({...c,product_count:db.count('products',{category_id:c.id})}))
  res.json({data:cats})
})
app.post('/api/categories',admin,(req,res)=>{
  const{slug,name_en,name_ar=''}=req.body
  if(!slug||!name_en) return res.status(400).json({error:'slug and name_en required'})
  const cat=db.insert('categories',{slug,name_en,name_ar})
  res.status(201).json(cat)
})
app.delete('/api/categories/:id',admin,(req,res)=>{
  db.delete('categories',Number(req.params.id)); res.json({message:'Category deleted'})
})

// ════════ STATS ════════
app.get('/api/stats',admin,(req,res)=>{
  const recentOrders=db.all('orders').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10)
  const itemCounts={}
  db.all('order_items').forEach(i=>{itemCounts[i.product_id]=(itemCounts[i.product_id]||0)+1})
  const topProducts=Object.entries(itemCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([pid,sold])=>{
    const p=db.byId('products',Number(pid))
    const b=p?db.byId('brands',p.brand_id):null
    return{id:Number(pid),name:p?.name||'',brand:b?.name||'',sold}
  })
  res.json({
    total_products: db.count('products'),
    total_orders:   db.count('orders'),
    total_users:    db.count('users',{role:'customer'}),
    total_revenue:  db.sum('orders','total',{status:'delivered'}),
    total_auctions: db.count('auctions'),
    active_auctions:db.all('auctions').filter(a=>a.enabled!==0&&!a.manually_ended&&new Date(a.end_date)>new Date()&&new Date(a.start_date)<=new Date()).length,
    recent_orders:  recentOrders,
    top_products:   topProducts,
  })
})

// ════════ USERS ════════
app.get('/api/users',admin,(req,res)=>{
  const users=db.all('users').map(({password:_,...u})=>u)
  res.json({data:users})
})

// ════════ UPLOAD ════════
app.post('/api/upload',admin,upload.single('image'),(req,res)=>{
  if(!req.file) return res.status(400).json({error:'No image provided'})
  const url = `/uploads/${req.file.filename}`
  res.json({url,filename:req.file.filename})
})

// ════════ HERO SLIDES ════════
app.get('/api/slides',(req,res)=>{
  const slides=db.all('hero_slides').filter(s=>s.active!=0).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
  res.json({data:slides})
})
app.get('/api/slides/all',admin,(req,res)=>{
  const slides=db.all('hero_slides').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
  res.json({data:slides})
})
app.post('/api/slides',admin,(req,res)=>{
  const{title_en='',title_ar='',subtitle_en='',subtitle_ar='',cta_en='Shop Now',cta_ar='تسوق الآن',image_url,active=1,sort_order=0}=req.body
  if(!image_url) return res.status(400).json({error:'image_url is required'})
  const slide=db.insert('hero_slides',{title_en,title_ar,subtitle_en,subtitle_ar,cta_en,cta_ar,image_url,active:active?1:0,sort_order:Number(sort_order)})
  res.status(201).json(slide)
})
app.put('/api/slides/:id',admin,(req,res)=>{
  const id=Number(req.params.id)
  if(!db.byId('hero_slides',id)) return res.status(404).json({error:'Not found'})
  const allowed=['title_en','title_ar','subtitle_en','subtitle_ar','cta_en','cta_ar','image_url','active','sort_order']
  const updates={}
  allowed.forEach(f=>{
    if(req.body[f]!==undefined) updates[f]=f==='active'?(req.body[f]?1:0):f==='sort_order'?Number(req.body[f]):req.body[f]
  })
  const slide=db.update('hero_slides',id,updates)
  res.json(slide)
})
app.delete('/api/slides/:id',admin,(req,res)=>{
  db.delete('hero_slides',Number(req.params.id)); res.json({message:'Slide deleted'})
})

// ════════ AUCTION HELPERS ════════
function resolveAuctionStatus(a) {
  if (!a) return 'ended'
  if (a.manually_ended) return 'ended'
  const now = Date.now()
  const start = new Date(a.start_date).getTime()
  const end = new Date(a.end_date).getTime()
  if (isNaN(start) || isNaN(end)) return 'ended'
  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'live'
  return 'ended'
}

function fullAuction(a) {
  if(!a) return null
  const status=resolveAuctionStatus(a)
  const bids=db.all('bids',{auction_id:a.id}).sort((x,y)=>y.amount-x.amount)
  const current_highest_bid=bids.length?bids[0].amount:null
  const bidderIds=new Set(bids.map(b=>b.user_id))
  const winner=db.get('auction_winners',{auction_id:a.id})
  // Auto-select winner if ended and no winner yet
  if(status==='ended'&&!winner&&bids.length>0){
    const top=bids[0]
    db.insert('auction_winners',{auction_id:a.id,user_id:top.user_id,user_name:top.user_name,amount:top.amount})
  }
  const finalWinner=winner||db.get('auction_winners',{auction_id:a.id})
  const images=db.all('auction_images',{auction_id:a.id}).sort((x,y)=>x.sort_order-y.sort_order).map(i=>i.url)
  return {
    ...a,
    status,
    current_highest_bid,
    bid_count:bids.length,
    bidder_count:bidderIds.size,
    winner:finalWinner?{user_name:finalWinner.user_name,amount:finalWinner.amount}:null,
    images: images.length ? images : (a.image_url ? [a.image_url] : ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80']),
  }
}

// ════════ AUCTIONS ════════
// Public: list auctions
app.get('/api/auctions',(req,res)=>{
  let list=db.all('auctions').filter(a=>a.enabled!==0).map(fullAuction)
  if(req.query.status) list=list.filter(a=>a.status===req.query.status)
  list.sort((a,b)=>{
    const order={live:0,upcoming:1,ended:2}
    const diff = (order[a.status]??9)-(order[b.status]??9)
    if (diff !== 0) return diff
    const endA = new Date(a.end_date).getTime() || 0
    const endB = new Date(b.end_date).getTime() || 0
    return endA - endB
  })
  res.json({data:list,total:list.length})
})

// Public: single auction with bids
app.get('/api/auctions/:id',(req,res)=>{
  const a=db.byId('auctions',Number(req.params.id))
  if(!a) return res.status(404).json({error:'Not found'})
  const result=fullAuction(a)
  result.bids=db.all('bids',{auction_id:a.id}).sort((x,y)=>new Date(y.created_at)-new Date(x.created_at)).map(b=>({id:b.id,user_name:b.user_name,amount:b.amount,created_at:b.created_at}))
  res.json(result)
})

// Auth: place bid
app.post('/api/auctions/:id/bid',auth,(req,res)=>{
  const a=db.byId('auctions',Number(req.params.id))
  if(!a) return res.status(404).json({error:'Auction not found'})
  const status=resolveAuctionStatus(a)
  if(status!=='live') return res.status(400).json({error:'Auction is not active'})
  if(a.enabled===0) return res.status(400).json({error:'Auction is disabled'})
  const{amount}=req.body
  if(!amount||isNaN(amount)) return res.status(400).json({error:'Valid bid amount required'})
  const bidAmount=Number(amount)
  const bids=db.all('bids',{auction_id:a.id}).sort((x,y)=>y.amount-x.amount)
  const highest=bids.length?bids[0].amount:0
  const minBid=highest>0?highest+a.min_increment:a.starting_price
  if(bidAmount<minBid) return res.status(400).json({error:`Bid must be at least $${minBid.toLocaleString()}`})
  // Anti-spam: reject if same user bid within last 3 seconds
  const recentBid=bids.find(b=>b.user_id===req.user.id)
  if(recentBid){
    const diff=Date.now()-new Date(recentBid.created_at.replace(' ','T')+'Z').getTime()
    if(diff<3000) return res.status(429).json({error:'Please wait before placing another bid'})
  }
  const bid=db.insert('bids',{auction_id:a.id,user_id:req.user.id,user_name:req.user.name,amount:bidAmount})
  res.status(201).json({message:'Bid placed successfully',bid:{id:bid.id,amount:bidAmount,user_name:req.user.name}})

  // ── Notification hooks ──
  const auctionImage = (db.all('auction_images',{auction_id:a.id}).sort((x,y)=>x.sort_order-y.sort_order)[0]||{}).url || a.image_url || ''
  // Notify previous highest bidder (outbid)
  if(bids.length>0 && bids[0].user_id!==req.user.id){
    notificationService.create(bids[0].user_id, notificationService.TYPES.OUTBID, {
      auctionId: a.id,
      title: "You've Been Outbid",
      message: `Your bid on ${a.name} has been exceeded. Current bid: $${bidAmount.toLocaleString()}.`,
      imageUrl: auctionImage,
      actionUrl: `/auction/${a.id}`,
      dedupKey: `outbid_${bid.id}`,
      title_ar: 'تم المزايدة عليك',
      message_ar: `تم تجاوز مزايدتك على ${a.name}. المزايدة الحالية: $${bidAmount.toLocaleString()}.`
    })
  }
  // Notify other participants about new bid
  notificationService.createForParticipants(a.id, notificationService.TYPES.NEW_BID, {
    auctionId: a.id,
    title: 'New Bid',
    message: `A new bid of $${bidAmount.toLocaleString()} has been placed on ${a.name}.`,
    imageUrl: auctionImage,
    actionUrl: `/auction/${a.id}`,
    dedupKey: `bid_${bid.id}`,
    title_ar: 'مزايدة جديدة',
    message_ar: `تم وضع مزايدة جديدة بقيمة $${bidAmount.toLocaleString()} على ${a.name}.`
  }, req.user.id)
  // Admin notification
  notificationService.createAdminNotification(notificationService.TYPES.ADMIN_NEW_BID, {
    auctionId: a.id,
    title: 'New Bid Received',
    message: `${req.user.name} bid $${bidAmount.toLocaleString()} on ${a.name}.`,
    imageUrl: auctionImage,
    actionUrl: '/admin',
    title_ar: 'مزايدة جديدة',
    message_ar: `قام ${req.user.name} بالمزايدة بقيمة $${bidAmount.toLocaleString()} على ${a.name}.`
  })
})

// Admin: list all auctions (including disabled)
app.get('/api/auctions/admin/all',admin,(req,res)=>{
  const list=db.all('auctions').map(fullAuction).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
  res.json({data:list,total:list.length})
})

// Admin: create auction
app.post('/api/auctions',admin,(req,res)=>{
  const{name,brand='',description='',image_url='',starting_price,min_increment=50,start_date,end_date,enabled=1,images=[]}=req.body
  if(!name||!starting_price||!start_date||!end_date) return res.status(400).json({error:'name, starting_price, start_date, end_date required'})
  const startTime = new Date(start_date).getTime()
  const endTime = new Date(end_date).getTime()
  if(isNaN(startTime)||isNaN(endTime)) return res.status(400).json({error:'Invalid start_date or end_date'})
  if(endTime<=startTime) return res.status(400).json({error:'End date must be after start date'})
  const start_iso = new Date(startTime).toISOString()
  const end_iso = new Date(endTime).toISOString()
  const auction=db.insert('auctions',{name,brand,description,image_url:image_url||images[0]||'',starting_price:Number(starting_price),min_increment:Number(min_increment),start_date:start_iso,end_date:end_iso,enabled:enabled?1:0,manually_ended:0})
  if(images.length>0) images.forEach((url,i)=>db.insert('auction_images',{auction_id:auction.id,url,sort_order:i}))
  else if(image_url) db.insert('auction_images',{auction_id:auction.id,url:image_url,sort_order:0})
  const result = fullAuction(auction)
  res.status(201).json(result)

  // ── Notify all users about new auction ──
  const aImg = (result.images && result.images[0]) || ''
  const timeUntilStart = startTime - Date.now()
  if (timeUntilStart > 0) {
    const rel = scheduler.formatTimeRemaining(timeUntilStart)
    notificationService.createForAllUsers(notificationService.TYPES.NEW_AUCTION, {
      auctionId: auction.id,
      title: 'New Upcoming Auction',
      message: `${auction.name} auction starts in ${rel.en}. Starting price: $${Number(auction.starting_price).toLocaleString()}.`,
      imageUrl: aImg,
      actionUrl: `/auction/${auction.id}`,
      dedupKey: 'new',
      title_ar: 'مزاد جديد قادم',
      message_ar: `مزاد ${auction.name} يبدأ خلال ${rel.ar}. سعر البداية: $${Number(auction.starting_price).toLocaleString()}.`
    })
  } else {
    notificationService.createForAllUsers(notificationService.TYPES.NEW_AUCTION, {
      auctionId: auction.id,
      title: 'New Auction Live',
      message: `${auction.name} is now LIVE for bidding! Starting price: $${Number(auction.starting_price).toLocaleString()}.`,
      imageUrl: aImg,
      actionUrl: `/auction/${auction.id}`,
      dedupKey: 'new',
      title_ar: 'مزاد مباشر جديد',
      message_ar: `مزاد ${auction.name} مباشر الآن للمزايدة! سعر البداية: $${Number(auction.starting_price).toLocaleString()}.`
    })
  }
})

// Admin: update auction
app.put('/api/auctions/:id',admin,(req,res)=>{
  const id=Number(req.params.id)
  if(!db.byId('auctions',id)) return res.status(404).json({error:'Not found'})
  const allowed=['name','brand','description','image_url','starting_price','min_increment','start_date','end_date','enabled']
  const updates={}
  allowed.forEach(f=>{
    if(req.body[f]!==undefined){
      if(f==='enabled') updates[f]=req.body[f]?1:0
      else if(['starting_price','min_increment'].includes(f)) updates[f]=Number(req.body[f])
      else if(['start_date','end_date'].includes(f)) {
        const t = new Date(req.body[f]).getTime()
        if (!isNaN(t)) updates[f] = new Date(t).toISOString()
      }
      else updates[f]=req.body[f]
    }
  })
  const oldAuction = db.byId('auctions',id)
  const oldStartDate = oldAuction?.start_date
  const oldEndDate = oldAuction?.end_date
  const a=db.update('auctions',id,updates)
  if(req.body.images){
    db.deleteWhere('auction_images',{auction_id:id})
    req.body.images.forEach((url,i)=>db.insert('auction_images',{auction_id:id,url,sort_order:i}))
    db.update('auctions',id,{image_url:req.body.images[0]||''})
  }
  // If dates changed, clear dedup so scheduler recalculates reminders
  if((updates.start_date && updates.start_date !== oldStartDate) || (updates.end_date && updates.end_date !== oldEndDate)){
    notificationService.clearAuctionDedup(id, 'UPCOMING_AUCTION')
    notificationService.clearAuctionDedup(id, 'AUCTION_ENDING')
    notificationService.clearAuctionDedup(id, 'AUCTION_STARTED')
  }
  res.json(fullAuction(db.byId('auctions',id)))
})

// Admin: delete auction
app.delete('/api/auctions/:id',admin,(req,res)=>{
  const id=Number(req.params.id)
  db.deleteWhere('bids',{auction_id:id})
  db.deleteWhere('auction_winners',{auction_id:id})
  db.deleteWhere('auction_images',{auction_id:id})
  notificationService.cleanupAuction(id)
  db.delete('auctions',id)
  res.json({message:'Auction deleted'})
})

// Admin: manually end auction
app.post('/api/auctions/:id/end',admin,(req,res)=>{
  const id=Number(req.params.id)
  const a=db.byId('auctions',id)
  if(!a) return res.status(404).json({error:'Not found'})
  db.update('auctions',id,{manually_ended:1})
  // Select winner
  const bids=db.all('bids',{auction_id:id}).sort((x,y)=>y.amount-x.amount)
  if(bids.length>0&&!db.get('auction_winners',{auction_id:id})){
    db.insert('auction_winners',{auction_id:id,user_id:bids[0].user_id,user_name:bids[0].user_name,amount:bids[0].amount})
  }
  const endedAuction = db.byId('auctions',id)
  const endedImage = (db.all('auction_images',{auction_id:id}).sort((x,y)=>x.sort_order-y.sort_order)[0]||{}).url || endedAuction.image_url || ''
  // Send winner/loser notifications
  if(bids.length>0){
    const winner = bids[0]
    notificationService.create(winner.user_id, notificationService.TYPES.AUCTION_WON, {
      auctionId: id, title: 'Congratulations! You Won!',
      message: `You won the ${endedAuction.name} auction with a final bid of $${Number(winner.amount).toLocaleString()}!`,
      imageUrl: endedImage, actionUrl: `/auction/${id}`, dedupKey: 'won',
      title_ar: '!مبروك! لقد فزت',
      message_ar: `لقد فزت بمزاد ${endedAuction.name} بمزايدة نهائية قدرها $${Number(winner.amount).toLocaleString()}!`
    })
    const participantIds = [...new Set(bids.map(b=>b.user_id))]
    for(const uid of participantIds){
      if(uid===winner.user_id) continue
      notificationService.create(uid, notificationService.TYPES.AUCTION_LOST, {
        auctionId: id, title: 'Auction Ended',
        message: `The ${endedAuction.name} auction has ended. Unfortunately, you were not the winning bidder.`,
        imageUrl: endedImage, actionUrl: `/auction/${id}`, dedupKey: 'lost',
        title_ar: 'انتهى المزاد',
        message_ar: `انتهى مزاد ${endedAuction.name}. للأسف، لم تفز في هذا المزاد.`
      })
    }
  }
  notificationService.createAdminNotification(notificationService.TYPES.ADMIN_AUCTION_ENDED, {
    auctionId: id, title: 'Auction Manually Ended',
    message: `${endedAuction.name} was manually ended.${bids.length>0?` Winner: ${bids[0].user_name} ($${Number(bids[0].amount).toLocaleString()})`:'No bids.'}`,
    imageUrl: endedImage, actionUrl: '/admin', dedupKey: 'admin_ended_manual',
    title_ar: 'تم إنهاء المزاد يدوياً',
    message_ar: `تم إنهاء ${endedAuction.name} يدوياً.${bids.length>0?` الفائز: ${bids[0].user_name} ($${Number(bids[0].amount).toLocaleString()})`:'لا يوجد مزايدات.'}`
  })
  res.json(fullAuction(db.byId('auctions',id)))
})

// ════════ NOTIFICATIONS ════════
// SSE stream endpoint
app.get('/api/notifications/stream',(req,res)=>{
  const token=(req.query.token||'').trim()
  if(!token) return res.status(401).json({error:'Token required'})
  let decoded
  if(token==='local-admin-token'){decoded={id:1,role:'admin',name:'Admin NNG'}}
  else{try{decoded=jwt.verify(token,SECRET)}catch{return res.status(401).json({error:'Invalid token'})}}
  sseManager.addClient(decoded.id,res)
})

// Get user notifications
app.get('/api/notifications',auth,(req,res)=>{
  const{limit=30,offset=0,type=''}=req.query
  const result=notificationService.getUserNotifications(req.user.id,{limit:Number(limit),offset:Number(offset),type})
  res.json(result)
})

// Get unread count
app.get('/api/notifications/unread-count',auth,(req,res)=>{
  res.json({count:notificationService.getUnreadCount(req.user.id)})
})

// Get preferences
app.get('/api/notifications/preferences',auth,(req,res)=>{
  res.json(notificationService.getPreferences(req.user.id))
})

// Update preferences
app.put('/api/notifications/preferences',auth,(req,res)=>{
  const result=notificationService.updatePreferences(req.user.id,req.body)
  res.json(result)
})

// Mark all as read (MUST be before :id/read to avoid route conflict)
app.patch('/api/notifications/read-all',auth,(req,res)=>{
  const count=notificationService.markAllRead(req.user.id)
  res.json({success: true, count, unreadCount: notificationService.getUnreadCount(req.user.id), message:`Marked ${count} as read`})
})
app.post('/api/notifications/read-all',auth,(req,res)=>{
  const count=notificationService.markAllRead(req.user.id)
  res.json({success: true, count, unreadCount: notificationService.getUnreadCount(req.user.id), message:`Marked ${count} as read`})
})

// Mark single notification as read
app.patch('/api/notifications/:id/read',auth,(req,res)=>{
  const ok=notificationService.markRead(Number(req.params.id),req.user.id)
  if(!ok) return res.status(404).json({error:'Not found or not yours'})
  res.json({success: true, unreadCount: notificationService.getUnreadCount(req.user.id), message:'Marked as read'})
})
app.post('/api/notifications/:id/read',auth,(req,res)=>{
  const ok=notificationService.markRead(Number(req.params.id),req.user.id)
  if(!ok) return res.status(404).json({error:'Not found or not yours'})
  res.json({success: true, unreadCount: notificationService.getUnreadCount(req.user.id), message:'Marked as read'})
})

// Delete notification
app.delete('/api/notifications/:id',auth,(req,res)=>{
  const ok=notificationService.deleteNotification(Number(req.params.id),req.user.id)
  if(!ok) return res.status(404).json({error:'Not found or not yours'})
  res.json({success: true, unreadCount: notificationService.getUnreadCount(req.user.id), message:'Deleted'})
})

// Admin notifications
app.get('/api/admin/notifications',admin,(req,res)=>{
  const{limit=30,offset=0}=req.query
  res.json(notificationService.getAdminNotifications(req.user.id,{limit:Number(limit),offset:Number(offset)}))
})

// Mark all admin notifications as read
app.patch('/api/admin/notifications/read-all',admin,(req,res)=>{
  const count=notificationService.markAllRead(req.user.id)
  res.json({success: true, count, message:`Marked ${count} as read`})
})
app.post('/api/admin/notifications/read-all',admin,(req,res)=>{
  const count=notificationService.markAllRead(req.user.id)
  res.json({success: true, count, message:`Marked ${count} as read`})
})

// Mark admin notification as read
app.patch('/api/admin/notifications/:id/read',admin,(req,res)=>{
  const ok=notificationService.markRead(Number(req.params.id),req.user.id)
  if(!ok) return res.status(404).json({error:'Not found'})
  res.json({success: true, message:'Marked as read'})
})
app.post('/api/admin/notifications/:id/read',admin,(req,res)=>{
  const ok=notificationService.markRead(Number(req.params.id),req.user.id)
  if(!ok) return res.status(404).json({error:'Not found'})
  res.json({success: true, message:'Marked as read'})
})

// Clear all admin notifications
app.delete('/api/admin/notifications/clear-all',admin,(req,res)=>{
  const count=notificationService.clearAllAdminNotifications(req.user.id)
  res.json({success: true, count, message:`Cleared ${count} admin notifications`})
})

// Delete single admin notification
app.delete('/api/admin/notifications/:id',admin,(req,res)=>{
  const ok=notificationService.deleteNotification(Number(req.params.id),req.user.id)
  if(!ok) return res.status(404).json({error:'Not found'})
  res.json({success: true, message:'Deleted'})
})

// Admin: manually re-announce an auction
app.post('/api/admin/auctions/:id/announce',admin,(req,res)=>{
  const a=db.byId('auctions',Number(req.params.id))
  if(!a) return res.status(404).json({error:'Auction not found'})
  const auction=fullAuction(a)
  const img=(auction.images&&auction.images[0])||''
  // Clear dedup for new_auction so it can be re-sent
  notificationService.clearAuctionDedup(a.id,'NEW_AUCTION')
  notificationService.createForAllUsers(notificationService.TYPES.NEW_AUCTION,{
    auctionId:a.id,
    title:'Auction Announcement',
    message:`${a.name} is available for bidding. Starting price: $${Number(a.starting_price).toLocaleString()}.`,
    imageUrl:img,
    actionUrl:`/auction/${a.id}`,
    dedupKey:'announce_'+Date.now(),
    title_ar: 'إعلان مزاد',
    message_ar: `${a.name} متاح للمزايدة. سعر البداية: $${Number(a.starting_price).toLocaleString()}.`
  })
  res.json({message:'Auction re-announced to all users'})
})

// Admin: get auction participants
app.get('/api/admin/auctions/:id/participants',admin,(req,res)=>{
  const participants=notificationService.getAuctionParticipants(Number(req.params.id))
  res.json({data:participants})
})

// ── Web Push ──
// Get VAPID public key (needed by frontend to subscribe)
app.get('/api/notifications/push/vapid-key',(req,res)=>{
  const key=pushService.getPublicKey()
  if(!key) return res.status(500).json({error:'Push not configured'})
  res.json({publicKey:key})
})

// Subscribe to push notifications
app.post('/api/notifications/push/subscribe',auth,(req,res)=>{
  const{subscription}=req.body
  if(!subscription||!subscription.endpoint||!subscription.keys) return res.status(400).json({error:'Invalid subscription'})
  pushService.saveSubscription(req.user.id,subscription)
  res.json({message:'Push subscription saved'})
})

// Unsubscribe from push notifications
app.post('/api/notifications/push/unsubscribe',auth,(req,res)=>{
  const{endpoint}=req.body
  if(!endpoint) return res.status(400).json({error:'Endpoint required'})
  pushService.removeSubscription(req.user.id,endpoint)
  res.json({message:'Push subscription removed'})
})

// ── Admin: Customer Management ──
app.get('/api/admin/customers',admin,(req,res)=>{
  const users=db.all('users').map(u=>{
    const orderCount=db.count('orders',{customer_email:u.email})
    const bidCount=db.count('bids',{user_id:u.id})
    const auctionIds=[...new Set(db.all('bids',{user_id:u.id}).map(b=>b.auction_id))]
    const wonCount=db.count('auction_winners',{user_id:u.id})
    return{
      id:u.id,name:u.name,email:u.email,phone:u.phone||'',location:u.location||'',
      role:u.role,created_at:u.created_at,status:u.status||'active',
      orderCount,bidCount,auctionCount:auctionIds.length,wonCount
    }
  })
  res.json({data:users})
})

app.get('/api/admin/customers/:id',admin,(req,res)=>{
  const u=db.byId('users',Number(req.params.id))
  if(!u) return res.status(404).json({error:'Customer not found'})
  const bids=db.all('bids',{user_id:u.id})
  const orders=db.all('orders',{customer_email:u.email})
  const wins=db.all('auction_winners',{user_id:u.id})
  res.json({
    id:u.id,name:u.name,email:u.email,phone:u.phone||'',location:u.location||'',
    role:u.role,created_at:u.created_at,status:u.status||'active',
    bids,orders,wins
  })
})

app.put('/api/admin/customers/:id/status',admin,(req,res)=>{
  const u=db.byId('users',Number(req.params.id))
  if(!u) return res.status(404).json({error:'Customer not found'})
  const{status}=req.body
  if(!['active','suspended','banned'].includes(status)) return res.status(400).json({error:'Invalid status'})
  db.update('users',u.id,{status})
  res.json({message:'Status updated'})
})

// ── Admin: Completed Auctions ──
app.get('/api/admin/completed-auctions',admin,(req,res)=>{
  const allAuctions=db.all('auctions')
  const completed=allAuctions.filter(a=>{
    if(a.manually_ended) return true
    const now=new Date()
    return new Date(a.end_date)<now
  }).map(a=>{
    const winner=db.get('auction_winners',{auction_id:a.id})
    let winnerProfile=null
    if(winner){
      const u=db.byId('users',winner.user_id)
      if(u) winnerProfile={id:u.id,name:u.name,email:u.email,phone:u.phone||'',location:u.location||''}
    }
    const bids=db.all('bids',{auction_id:a.id})
    const images=db.all('auction_images',{auction_id:a.id}).sort((x,y)=>x.sort_order-y.sort_order)
    const linkedOrder=winner?db.get('orders',{auction_id:a.id}):null
    return{
      id:a.id,name:a.name,brand:a.brand||'',image_url:images.length>0?images[0].url:(a.image_url||''),
      starting_price:a.starting_price,start_date:a.start_date,end_date:a.end_date,
      totalBids:bids.length,
      finalPrice:winner?winner.amount:(bids.length>0?Math.max(...bids.map(b=>b.amount)):a.starting_price),
      winner:winner?{...winner,profile:winnerProfile}:null,
      order:linkedOrder?{id:linkedOrder.id,order_number:linkedOrder.order_number,status:linkedOrder.status,payment_status:linkedOrder.payment_status||'pending'}:null
    }
  }).sort((a,b)=>new Date(b.end_date)-new Date(a.end_date))
  res.json({data:completed})
})

// ── Auction Winner Order ──
app.post('/api/auctions/:id/winner-order',auth,(req,res)=>{
  const auctionId=Number(req.params.id)
  const auction=db.byId('auctions',auctionId)
  if(!auction) return res.status(404).json({error:'Auction not found'})
  const winner=db.get('auction_winners',{auction_id:auctionId})
  if(!winner) return res.status(400).json({error:'No winner for this auction'})
  if(winner.user_id!==req.user.id) return res.status(403).json({error:'Only the auction winner can create this order'})
  // Check for existing order
  const existingOrder=db.get('orders',{auction_id:auctionId})
  if(existingOrder) return res.status(409).json({error:'ORDER_EXISTS',order_number:existingOrder.order_number})
  const{shipping_address,city,country,notes}=req.body
  if(!shipping_address||!city||!country) return res.status(400).json({error:'Shipping address, city and country are required'})
  const user=db.byId('users',req.user.id)
  const orderNumber='ORD-'+new Date().getFullYear()+'-'+String(Math.floor(100000+Math.random()*900000))
  const order=db.insert('orders',{
    order_number:orderNumber,
    customer_name:user.name,customer_email:user.email,customer_phone:user.phone||'',
    shipping_address,city,country,notes:notes||'',
    subtotal:winner.amount,shipping:0,total:winner.amount,
    status:'pending',payment_status:'pending',
    auction_id:auctionId,
    is_auction_order:1
  })
  // Add auction item as order item
  const images=db.all('auction_images',{auction_id:auctionId}).sort((x,y)=>x.sort_order-y.sort_order)
  db.insert('order_items',{
    order_id:order.id,
    product_name:auction.name,
    product_brand:auction.brand||'',
    product_image:images.length>0?images[0].url:(auction.image_url||''),
    price:winner.amount,
    quantity:1
  })
  res.status(201).json({order_number:orderNumber,total:winner.amount})
})

// ── Extend stats with auction data ──
const _origStatsHandler = app._router.stack.find(l=>l.route&&l.route.path==='/api/stats'&&l.route.methods.get)

// ════════ START ════════
if(db.count('users')===0){
  const bcrypt = require('bcryptjs')
  db.insert('users',{name:'Admin NNG',email:'admin@nng.com',password:bcrypt.hashSync('admin123',10),role:'admin',phone:''})
  console.log('👤 Admin user created')
}

// Seed sample auctions if none exist
if(db.count('auctions')===0){
  const now=new Date()
  const d=(days)=>new Date(now.getTime()+days*86400000).toISOString()
  db.insert('auctions',{name:'Royal Oak Offshore',brand:'Audemars Piguet',description:'The iconic Royal Oak Offshore, a masterpiece of haute horlogerie. This 42mm timepiece features a stainless steel case with a ceramic bezel, automatic movement, and the signature octagonal shape.',image_url:'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80',starting_price:15000,min_increment:500,start_date:d(-2),end_date:d(5),enabled:1,manually_ended:0})
  db.insert('auction_images',{auction_id:1,url:'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80',sort_order:0})
  db.insert('auction_images',{auction_id:1,url:'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=600&q=80',sort_order:1})
  db.insert('auction_images',{auction_id:1,url:'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=600&q=80',sort_order:2})
  db.insert('auctions',{name:'Speedmaster Moonwatch',brand:'Omega',description:'The legendary Omega Speedmaster Professional, the same model worn on the Moon. Features a 42mm stainless steel case, manual-winding calibre 1861, and a tachymeter bezel.',image_url:'https://images.unsplash.com/photo-1548171916-c8d1c4adfab3?w=600&q=80',starting_price:8000,min_increment:200,start_date:d(-1),end_date:d(3),enabled:1,manually_ended:0})
  db.insert('auction_images',{auction_id:2,url:'https://images.unsplash.com/photo-1548171916-c8d1c4adfab3?w=600&q=80',sort_order:0})
  db.insert('auction_images',{auction_id:2,url:'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&q=80',sort_order:1})
  db.insert('auctions',{name:'Nautilus 5711',brand:'Patek Philippe',description:'The legendary Patek Philippe Nautilus 5711/1A. Featuring the iconic porthole-inspired case design, this highly coveted timepiece represents the pinnacle of luxury sport watches.',image_url:'https://images.unsplash.com/photo-1627037558426-c2d07beda3af?w=600&q=80',starting_price:45000,min_increment:1000,start_date:d(2),end_date:d(12),enabled:1,manually_ended:0})
  db.insert('auction_images',{auction_id:3,url:'https://images.unsplash.com/photo-1627037558426-c2d07beda3af?w=600&q=80',sort_order:0})
  db.insert('auction_images',{auction_id:3,url:'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=600&q=80',sort_order:1})
  db.insert('auction_images',{auction_id:3,url:'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80',sort_order:2})
  db.insert('auctions',{name:'Submariner Date 126610LN',brand:'Rolex',description:'The Rolex Submariner Date in Oystersteel with a black Cerachrom bezel. A reference among divers\' watches, water-resistant to 300 metres with a date display and Chromalight luminescence.',image_url:'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80',starting_price:12000,min_increment:300,start_date:d(-10),end_date:d(-1),enabled:1,manually_ended:0})
  db.insert('auction_images',{auction_id:4,url:'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80',sort_order:0})
  db.insert('auction_images',{auction_id:4,url:'https://images.unsplash.com/photo-1526045431048-f857369baa09?w=600&q=80',sort_order:1})
  // Add some sample bids for the ended auction
  db.insert('bids',{auction_id:4,user_id:1,user_name:'Ahmed K.',amount:12000})
  db.insert('bids',{auction_id:4,user_id:1,user_name:'Ahmed K.',amount:13500})
  // Add bids for live auctions
  db.insert('bids',{auction_id:1,user_id:1,user_name:'Collector42',amount:15000})
  db.insert('bids',{auction_id:1,user_id:1,user_name:'WatchFan',amount:15500})
  db.insert('bids',{auction_id:1,user_id:1,user_name:'Collector42',amount:16000})
  db.insert('bids',{auction_id:2,user_id:1,user_name:'SpeedKing',amount:8000})
  db.insert('bids',{auction_id:2,user_id:1,user_name:'MoonLover',amount:8200})
  console.log('🔨 Sample auctions seeded')
}
// ════════ PRODUCTION: serve frontend ════════
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(frontendDist)) {
  console.log(`🌐 Serving frontend from ${frontendDist}`)
  app.use(express.static(frontendDist))
  // SPA fallback — send index.html for any non-API, non-upload route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return res.status(404).json({error:'Not found'})
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
} else {
  console.log('⚠️  Frontend dist/ not found — API-only mode (use Vite dev server for frontend)')
}

app.listen(PORT,()=>{
  console.log(`\n🚀 NNG Backend running on http://localhost:${PORT}`)
  console.log(`📦 Products: ${db.count('products')} | Slides: ${db.count('hero_slides')} | Auctions: ${db.count('auctions')}`)
  console.log(`👤 Users: ${db.count('users')} | Orders: ${db.count('orders')}`)
  if (process.env.DB_PATH) console.log(`💾 Persistent DB: ${process.env.DB_PATH}`)
  if (process.env.UPLOADS_PATH) console.log(`💾 Persistent uploads: ${process.env.UPLOADS_PATH}`)
  console.log(`🔔 Notifications: ${db.count('notifications')}`)

  // Start the auction scheduler
  scheduler.start(db, notificationService, sseManager)
  console.log('')
})
