import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Award,
  Plus, Edit2, Trash2, X, Menu, Check, ArrowLeft,
  Upload, RefreshCcw, AlertCircle, ChevronDown, LogOut,
  TrendingUp, DollarSign, Box, ClipboardList, Image
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import SlidesManager from "../components/SlidesManager";

// ── Helpers ───────────────────────────────────────────────
const S = (obj) => Object.assign({}, ...Object.values(obj).map((v,i) => ({[Object.keys(obj)[i]]:v})))

function Label({ children }) {
  return <div style={{fontSize:'0.62rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}}>{children}</div>
}

function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>
}

function StatusBadge({ status }) {
  const colors = { pending:'#f59e0b', processing:'#3b82f6', shipped:'#8b5cf6', delivered:'#4cc9a8', cancelled:'#e04444' }
  const c = colors[status] ?? '#888'
  return (
    <span style={{padding:'3px 10px',borderRadius:20,fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',background:`${c}20`,color:c,border:`1px solid ${c}40`,whiteSpace:'nowrap'}}>
      {status}
    </span>
  )
}

// ── Bottom nav for mobile ─────────────────────────────────
function BottomNav({ items, active, onChange }) {
  return (
    <div style={{
      position:'fixed',bottom:0,left:0,right:0,
      background:'var(--bg-secondary)',
      borderTop:'1px solid var(--border-subtle)',
      display:'flex',zIndex:700,
      paddingBottom:'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', padding:'10px 4px 8px',
          color: active===item.id ? 'var(--gold)' : 'var(--text-muted)',
          background:'transparent', border:'none', cursor:'pointer',
          fontSize:'0.55rem', fontWeight:600, letterSpacing:'0.05em',
          textTransform:'uppercase', gap:4,
          borderTop: active===item.id ? '2px solid var(--gold)' : '2px solid transparent',
          transition:'all 0.2s',
        }}>
          <item.icon size={18}/>
          <span>{item.label}</span>
          {item.badge > 0 && (
            <span style={{position:'absolute',top:6,background:'var(--gold)',color:'var(--bg-primary)',borderRadius:10,padding:'1px 5px',fontSize:'0.5rem',fontWeight:700}}>
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Desktop sidebar nav item ──────────────────────────────
function NavItem({ icon:Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:12, width:'100%',
      padding:'11px 16px', fontSize:'0.75rem', fontWeight:500,
      letterSpacing:'0.06em', textAlign:'left',
      color: active ? 'var(--gold)' : 'var(--text-secondary)',
      background: active ? 'var(--gold-muted)' : 'transparent',
      borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
      transition:'var(--transition)', border:'none', cursor:'pointer',
    }}>
      <Icon size={16}/>
      <span style={{flex:1}}>{label}</span>
      {badge > 0 && <span style={{background:'var(--gold)',color:'var(--bg-primary)',borderRadius:10,padding:'1px 7px',fontSize:'0.6rem',fontWeight:700}}>{badge}</span>}
    </button>
  )
}

// ── Stat card ─────────────────────────────────────────────
function StatCard({ icon:Icon, label, value, color='var(--gold)' }) {
  return (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:'16px',display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{fontSize:'0.62rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)'}}>{label}</div>
        <div style={{width:32,height:32,borderRadius:8,background:`${color}20`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon size={15} style={{color}}/>
        </div>
      </div>
      <div style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:400,color:'var(--off-white)',lineHeight:1}}>{value}</div>
    </div>
  )
}

// ── Product modal ─────────────────────────────────────────
function ProductModal({ product, onClose, onSave, brands, categories, uploadImage }) {
  const isEdit = !!product
  const [form, setForm] = useState(isEdit ? {
    name:product.name, brand_id:product.brand_id, category_id:product.category_id,
    price:product.price, original_price:product.original_price??'',
    reference:product.reference??'', movement:product.movement??'Automatic',
    case_material:product.case_material??'', diameter:product.diameter??'',
    water_resistance:product.water_resistance??'', description:product.description??'',
    in_stock:product.in_stock, is_new:product.is_new, is_featured:product.is_featured,
    images:product.images??[],
  } : {
    name:'', brand_id:brands[0]?.id??1, category_id:categories[0]?.id??1,
    price:'', original_price:'', reference:'', movement:'Automatic',
    case_material:'Stainless Steel', diameter:'', water_resistance:'',
    description:'', in_stock:true, is_new:false, is_featured:false,
    images:['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80'],
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadImage(file); set('images', [...form.images, url]) }
    catch (err) { setError('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await onSave({...form, price:parseFloat(form.price), original_price:form.original_price?parseFloat(form.original_price):null, brand_id:parseInt(form.brand_id), category_id:parseInt(form.category_id)})
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const inputStyle = {width:'100%',padding:'11px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none',fontFamily:'var(--font-body)'}

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,display:'flex',flexDirection:'column',animation:'fadeIn 0.2s ease'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)',flexShrink:0}}>
        <button onClick={onClose} style={{width:36,height:36,borderRadius:'50%',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-secondary)'}}>
          <X size={16}/>
        </button>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',fontWeight:300,flex:1}}>{isEdit?'Edit Product':'Add Product'}</h2>
        <button type="button" form="product-form" onClick={handleSubmit} className="btn btn-gold" style={{padding:'9px 20px',fontSize:'0.68rem'}} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Scrollable form */}
      <form id="product-form" onSubmit={handleSubmit} style={{flex:1,overflowY:'auto',padding:'20px',display:'grid',gap:16}}>
        {error && (
          <div style={{padding:'10px 14px',background:'rgba(224,68,68,0.08)',border:'1px solid rgba(224,68,68,0.25)',borderRadius:'var(--radius-sm)',fontSize:'0.78rem',color:'#e04444',display:'flex',gap:8,alignItems:'center'}}>
            <AlertCircle size={14}/>{error}
          </div>
        )}

        <Field label="Product Name *">
          <input style={inputStyle} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Submariner Date" required/>
        </Field>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Brand *">
            <select style={inputStyle} value={form.brand_id} onChange={e=>set('brand_id',e.target.value)}>
              {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Category *">
            <select style={inputStyle} value={form.category_id} onChange={e=>set('category_id',e.target.value)}>
              {categories.map(c=><option key={c.id} value={c.id}>{c.name_en}</option>)}
            </select>
          </Field>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Price ($) *">
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="12500" required/>
          </Field>
          <Field label="Original Price">
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.original_price} onChange={e=>set('original_price',e.target.value)} placeholder="Optional"/>
          </Field>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Movement">
            <select style={inputStyle} value={form.movement} onChange={e=>set('movement',e.target.value)}>
              {['Automatic','Manual','Quartz'].map(m=><option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reference">
            <input style={inputStyle} value={form.reference} onChange={e=>set('reference',e.target.value)} placeholder="126610LN"/>
          </Field>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Case Material">
            <input style={inputStyle} value={form.case_material} onChange={e=>set('case_material',e.target.value)} placeholder="Stainless Steel"/>
          </Field>
          <Field label="Diameter">
            <input style={inputStyle} value={form.diameter} onChange={e=>set('diameter',e.target.value)} placeholder="41mm"/>
          </Field>
        </div>

        <Field label="Water Resistance">
          <input style={inputStyle} value={form.water_resistance} onChange={e=>set('water_resistance',e.target.value)} placeholder="300m"/>
        </Field>

        <Field label="Description">
          <textarea style={{...inputStyle,resize:'vertical',minHeight:80}} rows={3} value={form.description} onChange={e=>set('description',e.target.value)}/>
        </Field>

        {/* Images */}
<div>
  <Label>Images</Label>

  {/* Image preview thumbnails */}
  {form.images.length > 0 && (
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
      {form.images.map((url,i) => (
        <div key={i} style={{position:'relative',width:72,height:72,borderRadius:'var(--radius-sm)',overflow:'hidden',border:'1px solid var(--border-subtle)'}}>
          <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'2px 0',background:'rgba(0,0,0,0.7)',color:'white',fontSize:'0.58rem',textAlign:'center',fontWeight:600}}>
            {i===0 ? 'MAIN' : `#${i+1}`}
          </div>
          <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
            style={{position:'absolute',top:3,right:3,width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,0.8)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer'}}>
            <X size={10}/>
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Individual URL inputs - one per image */}
  <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10}}>
    {form.images.map((url,i) => (
      <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
        <span style={{fontSize:'0.65rem',fontWeight:600,color:'var(--text-muted)',width:50,flexShrink:0}}>
          {i===0 ? 'MAIN' : `IMG ${i+1}`}
        </span>
        <input
          style={{...inputStyle,flex:1}}
          value={url}
          onChange={e=>set('images',form.images.map((u,j)=>j===i?e.target.value:u))}
          placeholder="https://..."
        />
        <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
          style={{width:36,height:36,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <X size={14}/>
        </button>
      </div>
    ))}
  </div>

  {/* Add buttons row */}
  <div style={{display:'flex',gap:8}}>
    <button type="button" onClick={()=>set('images',[...form.images,''])}
      style={{flex:1,padding:'10px',borderRadius:'var(--radius-sm)',border:'1px dashed var(--border)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:'0.72rem',fontWeight:500}}>
      <Plus size={14}/> Add Image URL
    </button>
    <label style={{flex:1,padding:'10px',borderRadius:'var(--radius-sm)',border:'1px dashed var(--border)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:'0.72rem',fontWeight:500}}>
      {uploading ? <RefreshCcw size={14} style={{animation:'spin 0.6s linear infinite',color:'var(--gold)'}}/> : <Upload size={14}/>}
      {uploading ? 'Uploading...' : 'Upload File'}
      <input type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}}/>
    </label>
  </div>
</div>

        {/* Toggles */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {[{k:'in_stock',label:'In Stock'},{k:'is_new',label:'New'},{k:'is_featured',label:'Featured'}].map(({k,label})=>(
            <button key={k} type="button" onClick={()=>set(k,!form[k])} style={{
              padding:'12px 8px', borderRadius:'var(--radius-sm)', cursor:'pointer',
              border:`1px solid ${form[k]?'var(--gold)':'var(--border-subtle)'}`,
              background: form[k] ? 'var(--gold-muted)' : 'var(--bg-elevated)',
              color: form[k] ? 'var(--gold)' : 'var(--text-muted)',
              fontSize:'0.72rem', fontWeight:500, display:'flex', flexDirection:'column',
              alignItems:'center', gap:6, transition:'var(--transition)',
            }}>
              <div style={{width:20,height:20,borderRadius:4,border:`1px solid ${form[k]?'var(--gold)':'var(--border-subtle)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {form[k] && <Check size={12} style={{color:'var(--gold)'}}/>}
              </div>
              {label}
            </button>
          ))}
        </div>

        {/* Bottom padding for mobile nav */}
        <div style={{height:16}}/>
      </form>
    </div>
  )
}

// ── Order card for mobile ─────────────────────────────────
function OrderCard({ order, onStatusChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',overflow:'hidden',marginBottom:10}}>
      <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>setOpen(!open)}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--gold)',marginBottom:4}}>{order.order_number}</div>
          <div style={{fontSize:'0.85rem',fontWeight:500,color:'var(--text-primary)',marginBottom:2}}>{order.customer_name}</div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'0.75rem',fontWeight:600,color:'var(--off-white)'}}>${Number(order.total).toLocaleString()}</span>
            <StatusBadge status={order.status}/>
          </div>
        </div>
        <ChevronDown size={16} style={{color:'var(--text-muted)',transform:open?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0}}/>
      </div>
      {open && (
        <div style={{padding:'0 16px 16px',borderTop:'1px solid var(--border-subtle)',paddingTop:14}}>
          <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:4}}>{order.customer_email}</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:12}}>{order.city}, {order.country} · {order.created_at?.slice(0,10)}</div>
          <Label>Update Status</Label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:6}}>
            {['pending','processing','shipped','delivered','cancelled'].map(s => (
              <button key={s} onClick={()=>onStatusChange(order.id,s)} style={{
                padding:'8px 4px', borderRadius:'var(--radius-sm)', cursor:'pointer',
                border:`1px solid ${order.status===s?'var(--gold)':'var(--border-subtle)'}`,
                background: order.status===s ? 'var(--gold-muted)' : 'var(--bg-elevated)',
                color: order.status===s ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize:'0.6rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em',
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Admin component ──────────────────────────────────
export default function AdminPage() {
  const {
    t, dir, isAdmin, logout, products, productsLoading, loadProducts,
    brands, categories, loadBrands, loadCategories,
    createProduct, updateProduct, deleteProduct,
    orders, loadOrders, updateOrderStatus,
    stats, loadStats, addBrand, deleteBrand, addCategory, deleteCategory, uploadImage
  } = useStore()

  const navigate    = useNavigate()
  const [section, setSection]         = useState('dashboard')
  const [productModal, setProductModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQ, setSearchQ]         = useState('')
  const [newBrand, setNewBrand]       = useState('')
  const [newCategory, setNewCategory] = useState({slug:'',name_en:'',name_ar:''})
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth check
  const [authChecked, setAuthChecked] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAuthChecked(true), 300); return () => clearTimeout(t) }, [])
  useEffect(() => { if (authChecked && !isAdmin) navigate('/') }, [authChecked, isAdmin])

  // Resize listener
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Load data
  useEffect(() => {
    loadProducts()
    loadBrands()
    loadCategories()
  }, [])

  useEffect(() => {
    if (section === 'dashboard') loadStats()
    if (section === 'orders')    loadOrders()
  }, [section])

  const navItems = [
    { id:'dashboard', icon:LayoutDashboard, label:'Dashboard' },
    { id:'slides', icon:Image, label:'Hero Slides' },
    { id:'products',  icon:Package,         label:'Products',   badge:products.length },
    { id:'orders',    icon:ShoppingCart,    label:'Orders',     badge:orders.filter(o=>o.status==='pending').length },
    { id:'brands',    icon:Award,           label:'Brands' },
    { id:'categories',icon:Tag,             label:'Categories' },
  ]

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.brand_name?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const changeSection = (id) => { setSection(id); setSidebarOpen(false) }

  // ── Shared content area styles ──────────────────────────
  const contentStyle = {
    flex:1,
    marginLeft: isMobile ? 0 : 220,
    padding: isMobile ? '16px 14px' : '24px 28px',
    paddingBottom: isMobile ? 90 : 24,
    minHeight:'100vh',
    overflowX:'hidden',
  }

  const pageTitle = navItems.find(n=>n.id===section)?.label || 'Admin'

  return (
    <div dir={dir} style={{background:'var(--bg-primary)',minHeight:'100vh',display:'flex'}}>

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <div style={{width:220,background:'var(--bg-secondary)',borderRight:'1px solid var(--border-subtle)',position:'fixed',top:0,left:0,bottom:0,display:'flex',flexDirection:'column',zIndex:600}}>
          <div style={{padding:'20px 16px',borderBottom:'1px solid var(--border-subtle)'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'1.4rem',color:'var(--gold)',letterSpacing:'0.2em',marginBottom:2}}>NNG</div>
            <div style={{fontSize:'0.6rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-muted)'}}>Admin Panel</div>
          </div>
          <nav style={{flex:1,padding:'12px 0',overflowY:'auto'}}>
            {navItems.map(item => (
              <NavItem key={item.id} {...item} active={section===item.id} onClick={()=>changeSection(item.id)}/>
            ))}
          </nav>
          <div style={{padding:16,borderTop:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',gap:8}}>
            <button className="btn btn-outline" style={{width:'100%',padding:'9px',fontSize:'0.68rem'}} onClick={()=>navigate('/')}>
              <ArrowLeft size={13}/> Back to Store
            </button>
            <button className="btn btn-ghost" style={{width:'100%',padding:'8px',fontSize:'0.68rem',color:'var(--text-muted)'}} onClick={()=>{logout();navigate('/')}}>
              <LogOut size={13}/> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={contentStyle}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <div style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',color:'var(--gold)',letterSpacing:'0.15em'}}>NNG</div>
              <div style={{fontSize:'0.75rem',fontWeight:500,color:'var(--text-secondary)'}}>{pageTitle}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline" style={{padding:'8px 12px',fontSize:'0.65rem'}} onClick={()=>navigate('/')}>
                <ArrowLeft size={12}/> Store
              </button>
              <button className="btn btn-ghost" style={{padding:'8px',color:'var(--text-muted)'}} onClick={()=>{logout();navigate('/')}}>
                <LogOut size={16}/>
              </button>
            </div>
          </div>
        )}

        {/* Desktop page title */}
        {!isMobile && (
          <div style={{marginBottom:28}}>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',fontWeight:300,color:'var(--off-white)'}}>{pageTitle}</h1>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {section==='dashboard' && (
          <div style={{animation:'fadeInUp 0.4s ease'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:20}}>
              <StatCard icon={Package}       label="Products"  value={stats?.total_products??products.length} color='var(--gold)'/>
              <StatCard icon={ClipboardList} label="Orders"    value={stats?.total_orders??orders.length}    color='#3b82f6'/>
              <StatCard icon={Users}         label="Customers" value={stats?.total_users??0}                  color='#8b5cf6'/>
              <StatCard icon={DollarSign}    label="Revenue"   value={`$${Number(stats?.total_revenue??0).toLocaleString()}`} color='#4cc9a8'/>
            </div>

            {stats?.recent_orders?.length > 0 && (
              <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:16}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border-subtle)',fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)'}}>Recent Orders</div>
                <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
                  {stats.recent_orders.slice(0,5).map(o=>(
                    <div key={o.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.82rem',fontWeight:500,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{o.customer_name}</div>
                        <div style={{fontSize:'0.65rem',color:'var(--text-muted)',fontFamily:'monospace'}}>{o.order_number}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--off-white)',marginBottom:3}}>${Number(o.total).toLocaleString()}</div>
                        <StatusBadge status={o.status}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <button className="btn btn-gold" style={{padding:'14px',fontSize:'0.7rem'}} onClick={()=>setProductModal('new')}>
                <Plus size={15}/> Add Product
              </button>
              <button className="btn btn-outline" style={{padding:'14px',fontSize:'0.7rem'}} onClick={()=>setSection('orders')}>
                <ShoppingCart size={15}/> View Orders
              </button>
            </div>
          </div>
        )}
        {section==='slides' && <SlidesManager />} 

        {/* ── PRODUCTS ── */}
        {section==='products' && (
          <div style={{animation:'fadeInUp 0.4s ease'}}>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
              <input
                style={{flex:1,minWidth:160,padding:'10px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none'}}
                placeholder="Search products..."
                value={searchQ}
                onChange={e=>setSearchQ(e.target.value)}
              />
              <button className="btn btn-gold" style={{padding:'10px 16px',fontSize:'0.7rem',whiteSpace:'nowrap'}} onClick={()=>setProductModal('new')}>
                <Plus size={14}/> Add
              </button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
              {filtered.map(p => (
                <div key={p.id} style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
                  <div style={{position:'relative',aspectRatio:'1',overflow:'hidden',background:'var(--bg-secondary)'}}>
                    <img src={p.images?.[0]} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                    {!p.in_stock && (
                      <div style={{position:'absolute',top:6,left:6,padding:'2px 8px',background:'rgba(0,0,0,0.75)',borderRadius:10,fontSize:'0.58rem',fontWeight:600,color:'#e04444',textTransform:'uppercase'}}>Out of Stock</div>
                    )}
                    {p.is_featured && (
                      <div style={{position:'absolute',top:6,right:6,padding:'2px 8px',background:'var(--gold-muted)',borderRadius:10,fontSize:'0.58rem',fontWeight:600,color:'var(--gold)',border:'1px solid rgba(201,168,76,0.3)'}}>Featured</div>
                    )}
                  </div>
                  <div style={{padding:'10px'}}>
                    <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:2}}>{p.brand_name}</div>
                    <div style={{fontSize:'0.85rem',fontWeight:500,color:'var(--text-primary)',marginBottom:6,lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
                    <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--off-white)',marginBottom:10}}>${Number(p.price).toLocaleString()}</div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setProductModal(p)} style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-subtle)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontSize:'0.65rem'}}>
                        <Edit2 size={11}/> Edit
                      </button>
                      <button onClick={()=>setDeleteConfirm(p)} style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {productsLoading && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>}
            {!productsLoading && filtered.length===0 && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:'0.85rem'}}>No products found</div>}
          </div>
        )}

        {/* ── ORDERS ── */}
        {section==='orders' && (
          <div style={{animation:'fadeInUp 0.4s ease'}}>
            {orders.length === 0
              ? <div style={{textAlign:'center',padding:60,color:'var(--text-muted)',fontSize:'0.85rem'}}>No orders yet</div>
              : orders.map(o => <OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus}/>)
            }
          </div>
        )}

        {/* ── BRANDS ── */}
        {section==='brands' && (
          <div style={{animation:'fadeInUp 0.4s ease'}}>
            <div style={{display:'flex',gap:10,marginBottom:16}}>
              <input
                style={{flex:1,padding:'11px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none'}}
                value={newBrand} onChange={e=>setNewBrand(e.target.value)}
                placeholder="New brand name..."
                onKeyDown={e=>{if(e.key==='Enter'&&newBrand){addBrand({name:newBrand});setNewBrand('')}}}
              />
              <button className="btn btn-gold" style={{padding:'11px 16px',fontSize:'0.7rem',whiteSpace:'nowrap'}} onClick={()=>{if(newBrand){addBrand({name:newBrand});setNewBrand('')}}}>
                <Plus size={14}/> Add
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {brands.map(b => (
                <div key={b.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.85rem',fontWeight:500,color:'var(--text-primary)'}}>{b.name}</div>
                    <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{b.product_count} products</div>
                  </div>
                  <button onClick={()=>deleteBrand(b.id)} style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {section==='categories' && (
          <div style={{animation:'fadeInUp 0.4s ease'}}>
            <div style={{display:'grid',gap:10,marginBottom:16}}>
              <input style={{padding:'11px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none'}} value={newCategory.slug} onChange={e=>setNewCategory(c=>({...c,slug:e.target.value}))} placeholder="Slug (e.g. dress)"/>
              <input style={{padding:'11px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none'}} value={newCategory.name_en} onChange={e=>setNewCategory(c=>({...c,name_en:e.target.value}))} placeholder="Name in English"/>
              <input style={{padding:'11px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none'}} value={newCategory.name_ar} onChange={e=>setNewCategory(c=>({...c,name_ar:e.target.value}))} placeholder="الاسم بالعربي"/>
              <button className="btn btn-gold" style={{padding:'12px',fontSize:'0.7rem'}} onClick={()=>{if(newCategory.slug&&newCategory.name_en){addCategory(newCategory);setNewCategory({slug:'',name_en:'',name_ar:''})}}}>
                <Plus size={14}/> Add Category
              </button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {categories.map(c => (
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.85rem',fontWeight:500,color:'var(--text-primary)'}}>{c.name_en}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--gold)'}}>{c.name_ar}</div>
                  </div>
                  <button onClick={()=>deleteCategory(c.id)} style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile bottom navigation ── */}
      {isMobile && <BottomNav items={navItems} active={section} onChange={changeSection}/>}

      {/* ── Product modal ── */}
      {productModal && (
        <ProductModal
          product={productModal==='new' ? null : productModal}
          brands={brands} categories={categories} uploadImage={uploadImage}
          onClose={() => setProductModal(null)}
          onSave={async (data) => {
            if (productModal==='new') await createProduct(data)
            else await updateProduct(productModal.id, data)
            setProductModal(null)
          }}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{maxWidth:340,padding:28,textAlign:'center',margin:16}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(224,68,68,0.1)',border:'1px solid rgba(224,68,68,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <Trash2 size={22} style={{color:'#e04444'}}/>
            </div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',marginBottom:8}}>Delete Product?</h3>
            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:24}}>
              This will permanently delete <strong style={{color:'var(--text-primary)'}}>{deleteConfirm.name}</strong>.
            </p>
            <div style={{display:'flex',gap:12}}>
              <button className="btn btn-outline" style={{flex:1,padding:'12px'}} onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button style={{flex:1,padding:'12px',background:'#e04444',color:'white',borderRadius:'var(--radius-sm)',fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',border:'none'}}
                onClick={async()=>{await deleteProduct(deleteConfirm.id);setDeleteConfirm(null)}}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
