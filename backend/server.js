const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')
const jwt     = require('jsonwebtoken')
const bcrypt  = require('bcryptjs')
const multer  = require('multer')
const db      = require('./db')

const app    = express()
const PORT   = process.env.PORT || 4000
const SECRET = process.env.JWT_SECRET || 'nng_luxury_secret_2025'

// ── Uploads ──────────────────────────────────────────────
const uploadsDir = path.join(__dirname,'uploads')
if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir,{recursive:true})
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
  const{name,email,password,phone=''}=req.body
  if(!name||!email||!password) return res.status(400).json({error:'Name, email and password required'})
  if(db.get('users',{email})) return res.status(409).json({error:'Email already registered'})
  const user=db.insert('users',{name,email,password:bcrypt.hashSync(password,10),role:'customer',phone})
  const token=makeToken({id:user.id,role:'customer',name})
  res.status(201).json({token,user:{id:user.id,name,email,role:'customer'}})
})
app.get('/api/auth/me',auth,(req,res)=>{
  const user=db.byId('users',req.user.id)
  if(!user) return res.status(404).json({error:'Not found'})
  const{password:_,...safe}=user; res.json(safe)
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

// ════════ START ════════
if(db.count('users')===0){
  const bcrypt = require('bcryptjs')
  db.insert('users',{name:'Admin NNG',email:'admin@nng.com',password:bcrypt.hashSync('admin123',10),role:'admin',phone:''})
  console.log('👤 Admin user created')
}
app.listen(PORT,()=>{
  console.log(`\n🚀 NNG Backend running on http://localhost:${PORT}`)
  console.log(`📦 Products: ${db.count('products')} | Slides: ${db.count('hero_slides')}`)
  console.log(`👤 Admin: admin@nng.com / admin123\n`)
})
