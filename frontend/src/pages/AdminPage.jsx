import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Award,
  Plus, Edit2, Trash2, X, Menu, Check, CheckCheck, ArrowLeft,
  Upload, RefreshCcw, AlertCircle, ChevronDown, LogOut,
  TrendingUp, DollarSign, Box, ClipboardList, Image, Gavel, Timer, StopCircle, Trophy, Bell, Megaphone,
  MapPin, Search, Phone, Mail, ExternalLink
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
  const ref = React.useRef(null)
  // Auto-scroll to active item
  React.useEffect(() => {
    if (!ref.current) return
    const el = ref.current.querySelector('[data-active="true"]')
    if (el) el.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [active])
  return (
    <div ref={ref} style={{
      position:'fixed',bottom:0,left:0,right:0,
      background:'var(--bg-secondary)',
      borderTop:'1px solid var(--border-subtle)',
      display:'flex',zIndex:700,
      overflowX:'auto', WebkitOverflowScrolling:'touch',
      scrollbarWidth:'none',
      paddingBottom:'env(safe-area-inset-bottom)',
    }}>
      <style>{`.admin-bnav::-webkit-scrollbar{display:none}`}</style>
      {items.map(item => (
        <button key={item.id} data-active={active===item.id} onClick={() => onChange(item.id)} style={{
          minWidth:64, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', padding:'8px 6px 6px',
          color: active===item.id ? 'var(--gold)' : 'var(--text-muted)',
          background:'transparent', border:'none', cursor:'pointer',
          fontSize:'0.48rem', fontWeight:600, letterSpacing:'0.04em',
          textTransform:'uppercase', gap:3,
          borderTop: active===item.id ? '2px solid var(--gold)' : '2px solid transparent',
          transition:'all 0.2s', position:'relative',
        }}>
          <item.icon size={16}/>
          <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:56}}>{item.label}</span>
          {item.badge > 0 && (
            <span style={{position:'absolute',top:4,right:8,background:'var(--gold)',color:'var(--bg-primary)',borderRadius:10,padding:'1px 4px',fontSize:'0.45rem',fontWeight:700}}>
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

// ── Product modal ─────────────────────────────────
function ProductModal({ product, brands, categories, onClose, onSave, uploadImage, t = {}, isMobile = false, dir = 'ltr' }) {
  const isEdit = !!product
  const [form, setForm] = useState(product ? {
    name: product.name||'', brand_id: product.brand_id||brands[0]?.id||1,
    category_id: product.category_id||categories[0]?.id||1, price: product.price||'',
    original_price: product.original_price||'', movement: product.movement||'Automatic',
    reference: product.reference||'', case_material: product.case_material||'',
    diameter: product.diameter||'', water_resistance: product.water_resistance||'',
    description: product.description||'',
    images: product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80']),
    in_stock: product.in_stock!==0, is_new: !!product.is_new, is_featured: !!product.is_featured,
  } : {
    name:'', brand_id: brands[0]?.id||1, category_id: categories[0]?.id||1,
    price:'', original_price:'', movement:'Automatic', reference:'',
    case_material:'', diameter:'', water_resistance:'', description:'',
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80'],
    in_stock:true, is_new:false, is_featured:false,
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

  const inputStyle = {
    width: '100%',
    maxWidth: '100%',
    padding: isMobile ? '10px 12px' : '11px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
    minWidth: 0,
  }

  return (
    <div dir={dir} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,display:'flex',flexDirection:'column',animation:'fadeIn 0.2s ease',width:'100vw',maxWidth:'100%',height:'100vh',maxHeight:'100%',boxSizing:'border-box',overflow:'hidden'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:isMobile?'12px 16px':'16px 20px',background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)',flexShrink:0,width:'100%',boxSizing:'border-box'}}>
        <button onClick={onClose} style={{width:34,height:34,borderRadius:'50%',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-secondary)',flexShrink:0}}>
          <X size={16}/>
        </button>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:isMobile?'1.05rem':'1.2rem',fontWeight:300,flex:1,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {isEdit ? 'Edit Product' : 'Add Product'}
        </h2>
        <button type="button" form="product-form" onClick={handleSubmit} className="btn btn-gold" style={{padding:isMobile?'8px 16px':'9px 20px',fontSize:'0.68rem',flexShrink:0}} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Scrollable form */}
      <form id="product-form" onSubmit={handleSubmit} style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:isMobile?'16px 14px 40px':'20px',display:'flex',flexDirection:'column',gap:14,width:'100%',maxWidth:600,margin:'0 auto',boxSizing:'border-box'}}>
        {error && (
          <div style={{padding:'10px 14px',background:'rgba(224,68,68,0.08)',border:'1px solid rgba(224,68,68,0.25)',borderRadius:'var(--radius-sm)',fontSize:'0.78rem',color:'#e04444',display:'flex',gap:8,alignItems:'center',boxSizing:'border-box'}}>
            <AlertCircle size={14} style={{flexShrink:0}}/><span>{error}</span>
          </div>
        )}

        <Field label="Product Name *">
          <input style={inputStyle} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Submariner Date" required/>
        </Field>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',boxSizing:'border-box'}}>
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

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',boxSizing:'border-box'}}>
          <Field label="Price ($) *">
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="12500" required/>
          </Field>
          <Field label="Original Price">
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.original_price} onChange={e=>set('original_price',e.target.value)} placeholder="Optional"/>
          </Field>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',boxSizing:'border-box'}}>
          <Field label="Movement">
            <select style={inputStyle} value={form.movement} onChange={e=>set('movement',e.target.value)}>
              {['Automatic','Manual','Quartz'].map(m=><option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Reference">
            <input style={inputStyle} value={form.reference} onChange={e=>set('reference',e.target.value)} placeholder="126610LN"/>
          </Field>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',boxSizing:'border-box'}}>
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
          <textarea style={{...inputStyle,resize:'vertical',minHeight:75}} rows={3} value={form.description} onChange={e=>set('description',e.target.value)}/>
        </Field>

        {/* Images */}
        <div style={{width:'100%',boxSizing:'border-box'}}>
          <Label>Images</Label>

          {/* Image preview thumbnails */}
          {form.images.length > 0 && (
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
              {form.images.filter(Boolean).map((url,i) => (
                <div key={i} style={{position:'relative',width:isMobile?58:68,height:isMobile?58:68,borderRadius:'var(--radius-sm)',overflow:'hidden',border:'1px solid var(--border-subtle)',flexShrink:0}}>
                  <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'2px 0',background:'rgba(0,0,0,0.75)',color:'white',fontSize:'0.55rem',textAlign:'center',fontWeight:700}}>
                    {i===0 ? 'MAIN' : `#${i+1}`}
                  </div>
                  <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
                    style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.85)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer'}}>
                    <X size={10}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Individual URL inputs - one per image */}
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10,width:'100%',boxSizing:'border-box'}}>
            {form.images.map((url,i) => (
              <div key={i} style={{display:'flex',gap:6,alignItems:'center',width:'100%',boxSizing:'border-box',minWidth:0}}>
                <span style={{fontSize:'0.62rem',fontWeight:600,color:'var(--text-muted)',width:isMobile?34:44,flexShrink:0,textAlign:'center'}}>
                  {i===0 ? 'MAIN' : `#${i+1}`}
                </span>
                <input
                  style={{...inputStyle,flex:1,minWidth:0}}
                  value={url}
                  onChange={e=>set('images',form.images.map((u,j)=>j===i?e.target.value:u))}
                  placeholder="https://..."
                />
                <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
                  style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>

          {/* Add buttons row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,width:'100%',boxSizing:'border-box'}}>
            <button type="button" onClick={()=>set('images',[...form.images,''])}
              style={{padding:'9px',borderRadius:'var(--radius-sm)',border:'1px dashed var(--border)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:isMobile?'0.65rem':'0.72rem',fontWeight:500}}>
              <Plus size={13}/> Add Image URL
            </button>
            <label style={{padding:'9px',borderRadius:'var(--radius-sm)',border:'1px dashed var(--border)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:isMobile?'0.65rem':'0.72rem',fontWeight:500}}>
              {uploading ? <RefreshCcw size={13} style={{animation:'spin 0.6s linear infinite',color:'var(--gold)'}}/> : <Upload size={13}/>}
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}}/>
            </label>
          </div>
        </div>

        {/* Toggles */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,width:'100%',boxSizing:'border-box'}}>
          {[{k:'in_stock',label:'In Stock'},{k:'is_new',label:'New'},{k:'is_featured',label:'Featured'}].map(({k,label})=>(
            <button key={k} type="button" onClick={()=>set(k,!form[k])} style={{
              padding:'10px 4px', borderRadius:'var(--radius-sm)', cursor:'pointer',
              border:`1px solid ${form[k]?'var(--gold)':'var(--border-subtle)'}`,
              background: form[k] ? 'var(--gold-muted)' : 'var(--bg-elevated)',
              color: form[k] ? 'var(--gold)' : 'var(--text-muted)',
              fontSize:'0.68rem', fontWeight:500, display:'flex', flexDirection:'column',
              alignItems:'center', gap:5, transition:'var(--transition)',
            }}>
              <div style={{width:18,height:18,borderRadius:3,border:`1px solid ${form[k]?'var(--gold)':'var(--border-subtle)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {form[k] && <Check size={11} style={{color:'var(--gold)'}}/>}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div style={{height:24}}/>
      </form>
    </div>
  )
}

// ── Order Card (Expanded with full customer & order details) ──
function OrderCard({ order, onStatusChange, t = {}, dir = 'ltr', isMobile = false }) {
  const [open, setOpen] = useState(false)
  const cust = order.customer_profile || {}
  const customerName = cust.name || order.customer_name || '—'
  const customerEmail = cust.email || order.customer_email || '—'
  const customerPhone = cust.phone || order.customer_phone || '—'
  const customerLocation = cust.location || (order.shipping_address ? `${order.shipping_address}, ${order.city || ''}, ${order.country || ''}`.replace(/^,\s*|,\s*$/g, '') : `${order.city || ''}, ${order.country || ''}`.replace(/^,\s*|,\s*$/g, '') || '—')

  return (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg, 12px)',overflow:'hidden',marginBottom:14}}>
      {/* Clickable Header */}
      <div style={{padding:isMobile?'12px 14px':'16px 20px',display:'flex',alignItems:'center',gap:isMobile?10:16,cursor:'pointer'}} onClick={()=>setOpen(!open)}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontFamily:'monospace',fontSize:isMobile?'0.7rem':'0.78rem',color:'var(--gold)',fontWeight:600}}>{order.order_number}</span>
            <StatusBadge status={order.status}/>
          </div>
          <div style={{fontSize:isMobile?'0.85rem':'0.95rem',fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{customerName}</div>
          <div style={{fontSize:isMobile?'0.65rem':'0.72rem',color:'var(--text-muted)'}}>
            {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'} • {order.item_count || (order.items && order.items.length) || 1} {t.orderedItems || 'item(s)'}
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontWeight:700,color:'var(--gold)',fontSize:isMobile?'0.9rem':'1.1rem'}}>${Number(order.total).toLocaleString()}</div>
          <div style={{fontSize:isMobile?'0.6rem':'0.68rem',color:'var(--text-muted)',textTransform:'capitalize'}}>{order.status}</div>
        </div>
        <ChevronDown size={isMobile?16:18} style={{color:'var(--text-muted)',transform:open?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0}}/>
      </div>

      {/* Expanded Details */}
      {open && (
        <div style={{padding:isMobile?'0 14px 16px':'0 20px 20px',borderTop:'1px solid var(--border-subtle)'}}>
          
          {/* Order Summary Grid */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fit,minmax(180px,1fr))',gap:isMobile?10:16,paddingTop:isMobile?12:16}}>
            <div>
              <Label>{t.orderDate || 'Order Date'}</Label>
              <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-primary)'}}>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</div>
            </div>
            <div>
              <Label>{t.subtotal || 'Subtotal'}</Label>
              <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-primary)'}}>${Number(order.subtotal || order.total).toLocaleString()}</div>
            </div>
            <div>
              <Label>{t.shipping || 'Shipping'}</Label>
              <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-primary)'}}>${Number(order.shipping || 0).toLocaleString()}</div>
            </div>
            <div>
              <Label>{t.total || 'Total'}</Label>
              <div style={{fontSize:isMobile?'0.75rem':'0.85rem',color:'var(--gold)',fontWeight:700}}>${Number(order.total).toLocaleString()}</div>
            </div>
          </div>

          {/* Customer Information Card (Matching Completed Auctions Design) */}
          <div style={{marginTop:isMobile?14:18,padding:isMobile?12:16,background:'rgba(201,168,76,0.05)',borderRadius:'var(--radius)',border:'1px solid rgba(201,168,76,0.15)'}}>
            <Label>{t.customerInfo || 'Customer Information'}</Label>
            <div style={{display:'flex',flexDirection:'column',gap:isMobile?8:10,marginTop:8}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Users size={isMobile?13:15} style={{color:'var(--gold)',flexShrink:0}}/>
                <span style={{fontSize:isMobile?'0.78rem':'0.85rem',color:'var(--text-primary)',fontWeight:600}}>{customerName}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Mail size={isMobile?13:15} style={{color:'var(--gold)',flexShrink:0}}/>
                <span style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{customerEmail}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <Phone size={isMobile?13:15} style={{color:'var(--gold)',flexShrink:0}}/>
                  <span style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-secondary)'}}>{customerPhone}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <MapPin size={isMobile?13:15} style={{color:'var(--gold)',flexShrink:0}}/>
                  <span style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-secondary)',wordBreak:'break-word'}}>{customerLocation}</span>
                </div>
              </div>
              {order.notes && (
                <div style={{fontSize:isMobile?'0.7rem':'0.78rem',color:'var(--text-muted)',fontStyle:'italic',marginTop:4,paddingTop:6,borderTop:'1px solid rgba(201,168,76,0.1)'}}>
                  <span style={{fontWeight:600,color:'var(--gold)'}}>{t.notes || 'Notes'}:</span> {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Ordered Items List */}
          {order.items && order.items.length > 0 && (
            <div style={{marginTop:isMobile?14:18}}>
              <Label>{t.orderedItems || 'Ordered Items'}</Label>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:6}}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:'var(--radius-sm)',fontSize:isMobile?'0.72rem':'0.78rem',border:'1px solid var(--border-subtle)'}}>
                    <div>
                      <div style={{fontWeight:500,color:'var(--text-primary)'}}>{item.product_name}</div>
                      <div style={{fontSize:isMobile?'0.62rem':'0.68rem',color:'var(--text-muted)'}}>{item.brand_name} • Qty: {item.quantity}</div>
                    </div>
                    <div style={{fontWeight:600,color:'var(--gold)'}}>${Number(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Status Buttons */}
          <div style={{marginTop:isMobile?14:18}}>
            <Label>{t.updateStatus || 'Update Status'}</Label>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(5,1fr)',gap:6,marginTop:6}}>
              {['pending','processing','shipped','delivered','cancelled'].map(s => (
                <button key={s} onClick={()=>onStatusChange(order.id,s)} style={{
                  padding:isMobile?'8px 4px':'10px 8px', borderRadius:'var(--radius-sm)', cursor:'pointer',
                  border:`1px solid ${order.status===s?'var(--gold)':'var(--border-subtle)'}`,
                  background: order.status===s ? 'var(--gold-muted)' : 'var(--bg-elevated)',
                  color: order.status===s ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize:isMobile?'0.6rem':'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em',
                  transition:'all 0.15s ease'
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function toLocalDatetimeString(dateInput) {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Auction modal ─────────────────────────────────
function AuctionModal({ initial, isEdit, onClose, onSave, uploadImage, t = {}, isMobile = false, dir = 'ltr' }) {
  const [form, setForm] = useState(initial)
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
    e?.preventDefault(); setSaving(true); setError('')
    try {
      if (!form.start_date || !form.end_date) {
        throw new Error('Start date and End date are required')
      }
      const startMs = new Date(form.start_date).getTime()
      const endMs = new Date(form.end_date).getTime()
      if (isNaN(startMs) || isNaN(endMs)) {
        throw new Error('Please select valid start and end dates')
      }
      if (endMs <= startMs) {
        throw new Error(t.endDateAfterStart || 'End date must be after start date')
      }
      await onSave({
        ...form,
        starting_price: parseFloat(form.starting_price),
        min_increment: parseFloat(form.min_increment),
        start_date: new Date(startMs).toISOString(),
        end_date: new Date(endMs).toISOString(),
      })
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const inputStyle = {
    width: '100%',
    maxWidth: '100%',
    padding: isMobile ? '10px 12px' : '11px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
    minWidth: 0,
  }

  return (
    <div dir={dir} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:1000,display:'flex',flexDirection:'column',animation:'fadeIn 0.2s ease',width:'100vw',maxWidth:'100%',height:'100vh',maxHeight:'100%',boxSizing:'border-box',overflow:'hidden'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:isMobile?'12px 16px':'16px 20px',background:'var(--bg-secondary)',borderBottom:'1px solid var(--border-subtle)',flexShrink:0,width:'100%',boxSizing:'border-box'}}>
        <button onClick={onClose} style={{width:34,height:34,borderRadius:'50%',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-secondary)',flexShrink:0}}>
          <X size={16}/>
        </button>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:isMobile?'1.05rem':'1.2rem',fontWeight:300,flex:1,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {isEdit ? (t.editAuction || 'Edit Auction') : (t.createAuction || 'Create Auction')}
        </h2>
        <button type="button" onClick={handleSubmit} className="btn btn-gold" style={{padding:isMobile?'8px 16px':'9px 20px',fontSize:'0.68rem',flexShrink:0}} disabled={saving}>
          {saving ? (t.loading || 'Saving...') : (t.save || 'Save')}
        </button>
      </div>

      {/* Scrollable form */}
      <form onSubmit={handleSubmit} style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:isMobile?'16px 14px 40px':'20px',display:'flex',flexDirection:'column',gap:14,width:'100%',maxWidth:600,margin:'0 auto',boxSizing:'border-box'}}>
        {error && (
          <div style={{padding:'10px 14px',background:'rgba(224,68,68,0.08)',border:'1px solid rgba(224,68,68,0.25)',borderRadius:'var(--radius-sm)',fontSize:'0.78rem',color:'#e04444',display:'flex',gap:8,alignItems:'center',boxSizing:'border-box'}}>
            <AlertCircle size={14} style={{flexShrink:0}}/><span>{error}</span>
          </div>
        )}

        <Field label={`${t.auctionName || 'Watch Name'} *`}>
          <input style={inputStyle} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Royal Oak Offshore" required/>
        </Field>

        <Field label={t.auctionBrand || 'Brand'}>
          <input style={inputStyle} value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="Audemars Piguet"/>
        </Field>

        <Field label={t.auctionDescription || 'Description'}>
          <textarea style={{...inputStyle, resize:'vertical', minHeight:75}} rows={3} value={form.description} onChange={e=>set('description',e.target.value)}/>
        </Field>

        {/* Images */}
        <div style={{width:'100%',boxSizing:'border-box'}}>
          <Label>{t.auctionImage || 'Images'}</Label>

          {/* Image preview thumbnails */}
          {form.images.length > 0 && (
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
              {form.images.filter(Boolean).map((url,i) => (
                <div key={i} style={{position:'relative',width:isMobile?58:68,height:isMobile?58:68,borderRadius:'var(--radius-sm)',overflow:'hidden',border:'1px solid var(--border-subtle)',flexShrink:0}}>
                  <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'2px 0',background:'rgba(0,0,0,0.75)',color:'white',fontSize:'0.55rem',textAlign:'center',fontWeight:700}}>
                    {i===0 ? 'MAIN' : `#${i+1}`}
                  </div>
                  <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
                    style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,0.85)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer'}}>
                    <X size={10}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Individual URL inputs - one per image */}
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10,width:'100%',boxSizing:'border-box'}}>
            {form.images.map((url,i) => (
              <div key={i} style={{display:'flex',gap:6,alignItems:'center',width:'100%',boxSizing:'border-box',minWidth:0}}>
                <span style={{fontSize:'0.62rem',fontWeight:600,color:'var(--text-muted)',width:isMobile?34:44,flexShrink:0,textAlign:'center'}}>
                  {i===0 ? 'MAIN' : `#${i+1}`}
                </span>
                <input
                  style={{...inputStyle, flex:1, minWidth:0}}
                  value={url}
                  onChange={e=>set('images',form.images.map((u,j)=>j===i?e.target.value:u))}
                  placeholder="https://..."
                />
                <button type="button" onClick={()=>set('images',form.images.filter((_,j)=>j!==i))}
                  style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>

          {/* Add buttons row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,width:'100%',boxSizing:'border-box'}}>
            <button type="button" onClick={()=>set('images',[...form.images,''])}
              style={{padding:'9px',borderRadius:'var(--radius-sm)',border:'1px dashed var(--border)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:isMobile?'0.65rem':'0.72rem',fontWeight:500}}>
              <Plus size={13}/> {t.addImageUrl || 'Add Image URL'}
            </button>
            <label style={{padding:'9px',borderRadius:'var(--radius-sm)',border:'1px dashed var(--border)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:isMobile?'0.65rem':'0.72rem',fontWeight:500}}>
              {uploading ? <RefreshCcw size={13} style={{animation:'spin 0.6s linear infinite',color:'var(--gold)'}}/> : <Upload size={13}/>}
              {uploading ? (t.loading || 'Uploading...') : (t.uploadFile || 'Upload File')}
              <input type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}}/>
            </label>
          </div>
        </div>

        {/* Pricing row */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',boxSizing:'border-box'}}>
          <Field label={`${t.startingPrice || 'Starting Price'} ($) *`}>
            <input style={inputStyle} type="number" step="0.01" min="0" value={form.starting_price} onChange={e=>set('starting_price',e.target.value)} placeholder="5000" required/>
          </Field>
          <Field label={`${t.minIncrement || 'Min Increment'} ($)`}>
            <input style={inputStyle} type="number" step="0.01" min="1" value={form.min_increment} onChange={e=>set('min_increment',e.target.value)} placeholder="50"/>
          </Field>
        </div>

        {/* Date fields - stacked on mobile, 2 columns on desktop */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,width:'100%',boxSizing:'border-box'}}>
          <Field label={`${t.auctionStartDate || 'Start Date'} *`}>
            <input style={inputStyle} type="datetime-local" value={form.start_date} onChange={e=>set('start_date',e.target.value)} required/>
          </Field>
          <Field label={`${t.auctionEndDate || 'End Date'} *`}>
            <input style={inputStyle} type="datetime-local" value={form.end_date} onChange={e=>set('end_date',e.target.value)} required/>
          </Field>
        </div>

        {/* Enabled toggle */}
        <button type="button" onClick={()=>set('enabled',!form.enabled)} style={{
          padding:'12px 16px', borderRadius:'var(--radius-sm)', cursor:'pointer',
          border:`1px solid ${form.enabled?'var(--gold)':'var(--border-subtle)'}`,
          background: form.enabled ? 'var(--gold-muted)' : 'var(--bg-elevated)',
          color: form.enabled ? 'var(--gold)' : 'var(--text-muted)',
          fontSize:'0.75rem', fontWeight:500, display:'flex',
          alignItems:'center', gap:10, transition:'var(--transition)',
          width:'100%', boxSizing:'border-box'
        }}>
          <div style={{width:20,height:20,borderRadius:4,border:`1px solid ${form.enabled?'var(--gold)':'var(--border-subtle)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {form.enabled && <Check size={12} style={{color:'var(--gold)'}}/>}
          </div>
          <span>{t.auctionEnabled || 'Enabled'}</span>
        </button>

        <div style={{height:24}}/>
      </form>
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
    stats, loadStats, addBrand, deleteBrand, addCategory, deleteCategory, uploadImage,
    auctions, auctionsLoading, loadAdminAuctions, createAuction, updateAuction, deleteAuction, endAuction, highlightHighestBid,
    api, addToast
  } = useStore()

  const navigate    = useNavigate()
  const [section, setSection]         = useState('dashboard')
  const [productModal, setProductModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQ, setSearchQ]         = useState('')
  const [newBrand, setNewBrand]       = useState('')
  const [newCategory, setNewCategory] = useState({slug:'',name_en:'',name_ar:''})
  const [auctionModal, setAuctionModal] = useState(null)
  const [deleteAuctionConfirm, setDeleteAuctionConfirm] = useState(null)
  const [highlightConfirm, setHighlightConfirm] = useState(null)
  const [highlighting, setHighlighting] = useState(false)
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminNotifs, setAdminNotifs] = useState([])
  const [adminNotifsLoading, setAdminNotifsLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [completedAucts, setCompletedAucts] = useState([])
  const [completedLoading, setCompletedLoading] = useState(false)
  const [expandedAuction, setExpandedAuction] = useState(null)

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

  const loadAdminNotifs = async () => {
    setAdminNotifsLoading(true)
    try {
      const res = await api('/admin/notifications?limit=50')
      setAdminNotifs(res.data || [])
    } catch {} finally { setAdminNotifsLoading(false) }
  }

  const loadCustomers = async () => {
    setCustomersLoading(true)
    try {
      const data = await api('/admin/customers')
      setCustomers(data.data || [])
    } catch {} finally { setCustomersLoading(false) }
  }

  const updateCustomerStatus = async (id, status) => {
    try {
      await api(`/admin/customers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      addToast('Status updated')
    } catch { addToast('Error', 'error') }
  }

  const loadCompletedAuctions = async () => {
    setCompletedLoading(true)
    try {
      const data = await api('/admin/completed-auctions')
      setCompletedAucts(data.data || [])
    } catch {} finally { setCompletedLoading(false) }
  }

  const markAdminNotifRead = async (id) => {
    try {
      await api(`/admin/notifications/${id}/read`, { method: 'PATCH' })
      setAdminNotifs(prev => prev.map(n => n.id === id ? {...n, is_read: 1} : n))
    } catch {}
  }

  const markAllAdminNotifsRead = async () => {
    try {
      await api('/admin/notifications/read-all', { method: 'PATCH' })
      setAdminNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })))
      addToast(t.allMarkedRead || 'All marked as read')
    } catch {
      addToast('Error', 'error')
    }
  }

  const clearAllAdminNotifs = async () => {
    if (!window.confirm('Delete all admin notifications?')) return
    try {
      await api('/admin/notifications/clear-all', { method: 'DELETE' })
      setAdminNotifs([])
      addToast('All notifications cleared')
    } catch {
      addToast('Error', 'error')
    }
  }

  const deleteAdminNotif = async (e, id) => {
    e.stopPropagation()
    try {
      await api(`/admin/notifications/${id}`, { method: 'DELETE' })
      setAdminNotifs(prev => prev.filter(n => n.id !== id))
      addToast('Notification deleted')
    } catch {
      addToast('Error', 'error')
    }
  }

  const announceAuction = async (auctionId) => {
    try {
      await api(`/admin/auctions/${auctionId}/announce`, { method: 'POST' })
      addToast('Auction re-announced to all users')
    } catch { addToast('Failed to announce', 'error') }
  }

  useEffect(() => {
    if (section === 'dashboard') loadStats()
    if (section === 'orders')    loadOrders()
    if (section === 'auctions')  loadAdminAuctions()
    if (section === 'notifications') loadAdminNotifs()
    if (section === 'customers') loadCustomers()
    if (section === 'completed') loadCompletedAuctions()
  }, [section])

  const navItems = [
    { id:'dashboard', icon:LayoutDashboard, label:'Dashboard' },
    { id:'slides', icon:Image, label:'Hero Slides' },
    { id:'products',  icon:Package,         label:'Products',   badge:products.length },
    { id:'orders',    icon:ShoppingCart,    label:'Orders',     badge:orders.filter(o=>o.status==='pending').length },
    { id:'customers', icon:Users, label:t.adminCustomers||'Customers' },
    { id:'completed', icon:Trophy, label:t.completedAuctions||'Completed Auctions' },
    { id:'brands',    icon:Award,           label:'Brands' },
    { id:'categories',icon:Tag,             label:'Categories' },
    { id:'auctions',  icon:Gavel,           label:t.adminAuctions||'Auctions', badge:auctions.filter(a=>a.status==='live').length },
    { id:'notifications', icon:Bell,         label:'Notifications', badge:adminNotifs.filter(n=>!n.is_read).length },
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
              <StatCard icon={Gavel}          label={t.adminAuctions||'Auctions'} value={stats?.active_auctions??0} color='#f59e0b'/>
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
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:isMobile?16:20,gap:8,flexWrap:'wrap'}}>
              <div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:isMobile?'1.1rem':'1.3rem',fontWeight:300,margin:0}}>{t.orders || 'Customer Orders'}</h2>
                <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:4}}>
                  {orders.length} {t.orders || 'orders'} • ${orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString()} {t.total || 'total'}
                </div>
              </div>
              <button className="btn btn-outline" style={{fontSize:'0.65rem',padding:'7px 14px'}} onClick={loadOrders}>
                <RefreshCcw size={14}/> {t.refresh || 'Refresh'}
              </button>
            </div>
            {orders.length === 0
              ? <div style={{textAlign:'center',padding:60,color:'var(--text-muted)',fontSize:'0.85rem'}}>No orders yet</div>
              : orders.map(o => <OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus} t={t} dir={dir} isMobile={isMobile}/>)
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

        {/* ── AUCTIONS ── */}
        {section==='auctions' && (
          <div style={{animation:'fadeInUp 0.4s ease'}}>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
              <button className="btn btn-gold" style={{padding:'10px 16px',fontSize:'0.7rem',whiteSpace:'nowrap'}} onClick={()=>setAuctionModal('new')}>
                <Plus size={14}/> {t.createAuction||'Create Auction'}
              </button>
            </div>

            {auctionsLoading && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>}

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {auctions.map(a => {
                const statusColors = {live:'#4cc9a8',upcoming:'#3b82f6',ended:'#888'}
                const sc = statusColors[a.status]||'#888'
                return (
                  <div key={a.id} style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
                    <div style={{display:'flex',gap:14,padding:'14px 16px',alignItems:'center'}}>
                      {/* Thumbnail */}
                      <div style={{width:56,height:56,borderRadius:'var(--radius-sm)',overflow:'hidden',flexShrink:0,background:'var(--bg-secondary)'}}>
                        <img src={(a.images&&a.images[0])||a.image_url||'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100&q=60'} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                          <span style={{fontSize:'0.85rem',fontWeight:500,color:'var(--text-primary)'}}>{a.name}</span>
                          <span style={{padding:'2px 8px',borderRadius:12,fontSize:'0.55rem',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',background:`${sc}20`,color:sc,border:`1px solid ${sc}40`}}>
                            {a.status==='live'?t.auctionLive:a.status==='upcoming'?t.auctionUpcoming:t.auctionEnded}
                          </span>
                          {!a.enabled && <span style={{padding:'2px 8px',borderRadius:12,fontSize:'0.55rem',fontWeight:700,background:'rgba(224,68,68,0.1)',color:'#e04444',border:'1px solid rgba(224,68,68,0.3)'}}>Disabled</span>}
                        </div>
                        <div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>
                          {a.brand} · {t.highestBid||'Highest Bid'}: <span style={{color:'var(--gold)',fontWeight:600}}>${Number(a.current_highest_bid||a.starting_price).toLocaleString()}</span> · {a.bid_count||0} {t.bidders||'bids'} · {a.bidder_count||0} {t.bidders||'bidders'}
                          {a.highlighted_bid_id && (
                            <span style={{
                              marginInlineStart: 8, padding: '1px 6px',
                              background: 'rgba(76,201,168,0.12)',
                              border: '1px solid rgba(76,201,168,0.35)',
                              borderRadius: 3,
                              fontSize: '0.55rem', fontWeight: 700,
                              color: '#4cc9a8',
                              display: 'inline-flex', alignItems: 'center', gap: 3
                            }}>
                              <Check size={9} strokeWidth={2.5}/> {t.adminHighlight || 'ADMIN HIGHLIGHT'}: ${Number(a.highlighted_bid_amount || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {a.winner && (
                          <div style={{fontSize:'0.62rem',color:'var(--gold)',marginTop:3}}>
                            <Trophy size={10} style={{display:'inline',verticalAlign:'middle',marginRight:4}}/> {t.auctionWinner||'Winner'}: {a.winner.user_name} — ${Number(a.winner.amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        {/* 4th Action: Highlight Highest Bid (GREEN) */}
                        <button
                          onClick={() => {
                            if (!a.bid_count || a.bid_count === 0) {
                              addToast(t.noBidsToHighlight || 'No bids available to highlight.', 'error')
                            } else {
                              setHighlightConfirm(a)
                            }
                          }}
                          title={t.markHighestBid || 'Mark Current Highest Bid'}
                          style={{
                            width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                            border: a.highlighted_bid_id ? '1px solid rgba(76,201,168,0.55)' : '1px solid rgba(76,201,168,0.3)',
                            background: a.highlighted_bid_id ? 'rgba(76,201,168,0.18)' : 'rgba(76,201,168,0.06)',
                            color: '#4cc9a8',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <CheckCheck size={14}/>
                        </button>
                        {a.status==='live' && (
                          <button onClick={()=>endAuction(a.id)} title={t.endAuction||'End Auction'} style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(245,158,11,0.3)',background:'rgba(245,158,11,0.05)',color:'#f59e0b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <StopCircle size={13}/>
                          </button>
                        )}
                        <button onClick={()=>setAuctionModal(a)} style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid var(--border-subtle)',background:'var(--bg-elevated)',color:'var(--text-secondary)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Edit2 size={13}/>
                        </button>
                        <button onClick={()=>setDeleteAuctionConfirm(a)} style={{width:34,height:34,borderRadius:'var(--radius-sm)',border:'1px solid rgba(224,68,68,0.3)',background:'rgba(224,68,68,0.05)',color:'#e04444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {!auctionsLoading && auctions.length===0 && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:'0.85rem'}}>{t.noAuctions||'No auctions yet'}</div>}
            </div>
          </div>
        )}

        {section==='notifications' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:20}}>
              <div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',fontWeight:400,margin:0}}>{t.notifications || 'Admin Notifications'}</h2>
                <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:4}}>
                  {adminNotifs.filter(n=>!n.is_read).length} {t.unread || 'unread'} • {adminNotifs.length} {t.total || 'total'}
                </div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {adminNotifs.some(n=>!n.is_read) && (
                  <button className="btn btn-outline" style={{fontSize:'0.65rem',padding:'8px 14px'}} onClick={markAllAdminNotifsRead}>
                    <CheckCheck size={14}/> {t.markAllRead || 'Mark All Read'}
                  </button>
                )}
                {adminNotifs.length > 0 && (
                  <button className="btn btn-outline" style={{fontSize:'0.65rem',padding:'8px 14px',color:'#e04444',borderColor:'rgba(224,68,68,0.3)'}} onClick={clearAllAdminNotifs}>
                    <Trash2 size={14}/> {t.clearAll || 'Clear All'}
                  </button>
                )}
                <button className="btn btn-outline" style={{fontSize:'0.65rem',padding:'8px 14px'}} onClick={loadAdminNotifs}>
                  <RefreshCcw size={14}/> {t.refresh || 'Refresh'}
                </button>
              </div>
            </div>
            {adminNotifsLoading && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>{t.loading || 'Loading...'}</div>}
            <div className="admin-notif-list">
              {adminNotifs.map(notif => (
                <div key={notif.id} className={`admin-notif-item ${notif.is_read ? '' : 'unread'}`} onClick={() => markAdminNotifRead(notif.id)}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:'var(--gold-soft, rgba(201,168,76,0.1))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--gold)'}}>
                    {notif.type==='ADMIN_NEW_BID' ? <TrendingUp size={16}/> : notif.type==='ADMIN_AUCTION_STARTED' ? <Megaphone size={16}/> : <Gavel size={16}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text-primary)'}}>{notif.title}</span>
                      {!notif.is_read && (
                        <span style={{fontSize:'0.58rem',padding:'2px 7px',borderRadius:10,background:'var(--gold)',color:'#000',fontWeight:700,letterSpacing:'0.04em'}}>
                          {t.newBadge || 'NEW'}
                        </span>
                      )}
                    </div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.45}}>{notif.message}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginTop:4}}>{notif.created_at}</div>
                  </div>
                  <button
                    onClick={(e) => deleteAdminNotif(e, notif.id)}
                    style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:6,borderRadius:4,transition:'color 0.15s',flexShrink:0}}
                    onMouseEnter={e => e.currentTarget.style.color = '#e04444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    title={t.delete || 'Delete'}
                  >
                    <Trash2 size={15}/>
                  </button>
                </div>
              ))}
              {!adminNotifsLoading && adminNotifs.length===0 && (
                <div style={{textAlign:'center',padding:50,color:'var(--text-muted)',fontSize:'0.85rem'}}>
                  <Bell size={36} strokeWidth={1} style={{marginBottom:10,opacity:0.5}}/>
                  <div>{t.noNotifications || 'No admin notifications'}</div>
                </div>
              )}
            </div>

            {/* Re-announce section */}
            {auctions.length > 0 && (
              <div style={{marginTop:32}}>
                <h3 style={{fontSize:'0.75rem',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--gold)',marginBottom:12}}>Re-announce Auctions</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {auctions.filter(a=>a.status!=='ended').map(a => (
                    <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)'}}>
                      <div>
                        <div style={{fontSize:'0.78rem',fontWeight:500,color:'var(--text-primary)'}}>{a.name}</div>
                        <div style={{fontSize:'0.65rem',color:'var(--text-muted)',textTransform:'uppercase'}}>{a.status}</div>
                      </div>
                      <button className="btn btn-outline" style={{fontSize:'0.6rem',padding:'6px 12px'}} onClick={()=>announceAuction(a.id)}>
                        <Megaphone size={12}/> Announce
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {section==='customers' && (
          <div>
            <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:20}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:isMobile?'1.1rem':'1.3rem',fontWeight:300,margin:0}}>{t.customerManagement||'Customer Management'}</h2>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',width:isMobile?'100%':'auto'}}>
                <div style={{position:'relative',flex:isMobile?1:'unset'}}>
                  <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
                  <input type="text" placeholder={t.searchCustomers||'Search customers...'} value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}
                    style={{paddingLeft:32,padding:'8px 12px 8px 32px',background:'var(--bg-primary)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text-primary)',fontSize:'0.75rem',width:'100%',minWidth:isMobile?0:200}}/>
                </div>
                <select value={customerFilter} onChange={e=>setCustomerFilter(e.target.value)}
                  style={{padding:'8px 12px',background:'var(--bg-primary)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:'var(--text-primary)',fontSize:'0.75rem'}}>
                  <option value="all">{t.all||'All'}</option>
                  <option value="active">{t.active||'Active'}</option>
                  <option value="suspended">{t.suspended||'Suspended'}</option>
                  <option value="banned">{t.banned||'Banned'}</option>
                </select>
              </div>
            </div>
            {customersLoading ? <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>{t.loading||'Loading...'}</div> : (
              <>
                {/* Desktop table */}
                {!isMobile && (
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.75rem'}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid var(--border)'}}>
                          {[t.customerId||'ID',t.customerName||'Name',t.customerEmail||'Email',t.customerPhone||'Phone',t.customerLocation||'Location',t.registrationDate||'Registered',t.totalBids||'Bids',t.totalAuctionsParticipated||'Auctions',t.totalWins||'Wins',t.customerStatus||'Status'].map((h,i)=>(
                            <th key={i} style={{padding:'10px 8px',textAlign:dir==='rtl'?'right':'left',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',fontSize:'0.6rem',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {customers
                          .filter(c=>c.role!=='admin')
                          .filter(c=>customerFilter==='all'||(c.status||'active')===customerFilter)
                          .filter(c=>!customerSearch||c.name?.toLowerCase().includes(customerSearch.toLowerCase())||c.email?.toLowerCase().includes(customerSearch.toLowerCase())||c.phone?.includes(customerSearch))
                          .map(c=>(
                          <tr key={c.id} style={{borderBottom:'1px solid var(--border-subtle)',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <td style={{padding:'12px 8px',color:'var(--text-muted)'}}>{c.id}</td>
                            <td style={{padding:'12px 8px',fontWeight:500,color:'var(--text-primary)'}}>{c.name}</td>
                            <td style={{padding:'12px 8px',color:'var(--text-secondary)'}}>{c.email}</td>
                            <td style={{padding:'12px 8px',color:'var(--text-secondary)'}}>{c.phone||'—'}</td>
                            <td style={{padding:'12px 8px',color:'var(--text-secondary)',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.location||'—'}</td>
                            <td style={{padding:'12px 8px',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{c.created_at?new Date(c.created_at).toLocaleDateString():'—'}</td>
                            <td style={{padding:'12px 8px',textAlign:'center'}}>{c.bidCount}</td>
                            <td style={{padding:'12px 8px',textAlign:'center'}}>{c.auctionCount}</td>
                            <td style={{padding:'12px 8px',textAlign:'center'}}>{c.wonCount}</td>
                            <td style={{padding:'12px 8px'}}>
                              <select value={c.status||'active'} onChange={e=>updateCustomerStatus(c.id,e.target.value)}
                                style={{padding:'4px 8px',background:'var(--bg-primary)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:c.status==='banned'?'#e04444':c.status==='suspended'?'#f59e0b':'#4cc9a8',fontSize:'0.65rem',fontWeight:600}}>
                                <option value="active">{t.active||'Active'}</option>
                                <option value="suspended">{t.suspended||'Suspended'}</option>
                                <option value="banned">{t.banned||'Banned'}</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Mobile cards */}
                {isMobile && (
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {customers
                      .filter(c=>c.role!=='admin')
                      .filter(c=>customerFilter==='all'||(c.status||'active')===customerFilter)
                      .filter(c=>!customerSearch||c.name?.toLowerCase().includes(customerSearch.toLowerCase())||c.email?.toLowerCase().includes(customerSearch.toLowerCase())||c.phone?.includes(customerSearch))
                      .map(c=>(
                      <div key={c.id} style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg,12px)',padding:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,color:'var(--text-primary)',fontSize:'0.85rem',marginBottom:2}}>{c.name}</div>
                            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.email}</div>
                          </div>
                          <select value={c.status||'active'} onChange={e=>updateCustomerStatus(c.id,e.target.value)}
                            style={{padding:'4px 8px',background:'var(--bg-primary)',border:'1px solid var(--border)',borderRadius:'var(--radius)',color:c.status==='banned'?'#e04444':c.status==='suspended'?'#f59e0b':'#4cc9a8',fontSize:'0.6rem',fontWeight:600,flexShrink:0}}>
                            <option value="active">{t.active||'Active'}</option>
                            <option value="suspended">{t.suspended||'Suspended'}</option>
                            <option value="banned">{t.banned||'Banned'}</option>
                          </select>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 12px',fontSize:'0.68rem'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)'}}>
                            <Phone size={12} style={{color:'var(--text-muted)',flexShrink:0}}/> {c.phone||'—'}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)'}}>
                            <MapPin size={12} style={{color:'var(--text-muted)',flexShrink:0}}/> <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.location||'—'}</span>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:12,marginTop:10,paddingTop:10,borderTop:'1px solid var(--border-subtle)',fontSize:'0.62rem'}}>
                          <div style={{textAlign:'center',flex:1}}>
                            <div style={{fontWeight:700,color:'var(--text-primary)',fontSize:'0.85rem'}}>{c.bidCount}</div>
                            <div style={{color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t.totalBids||'Bids'}</div>
                          </div>
                          <div style={{textAlign:'center',flex:1}}>
                            <div style={{fontWeight:700,color:'var(--text-primary)',fontSize:'0.85rem'}}>{c.auctionCount}</div>
                            <div style={{color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t.totalAuctionsParticipated||'Auctions'}</div>
                          </div>
                          <div style={{textAlign:'center',flex:1}}>
                            <div style={{fontWeight:700,color:'var(--gold)',fontSize:'0.85rem'}}>{c.wonCount}</div>
                            <div style={{color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{t.totalWins||'Wins'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {section==='completed' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:isMobile?16:24,gap:8}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:isMobile?'1.1rem':'1.3rem',fontWeight:300,margin:0}}>{t.completedAuctions||'Completed Auctions'}</h2>
              <button className="btn btn-outline" style={{fontSize:'0.6rem',padding:isMobile?'6px 10px':'7px 14px',flexShrink:0}} onClick={loadCompletedAuctions}>
                <RefreshCcw size={12}/> {t.refresh||'Refresh'}
              </button>
            </div>
            {completedLoading ? <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>{t.loading||'Loading...'}</div> : (
              <div style={{display:'flex',flexDirection:'column',gap:isMobile?10:16}}>
                {completedAucts.length===0 ? (
                  <div style={{textAlign:'center',padding:isMobile?40:60,color:'var(--text-muted)'}}>No completed auctions</div>
                ) : completedAucts.map(a=>(
                  <div key={a.id} style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg,12px)',overflow:'hidden'}}>
                    <div style={{display:'flex',gap:isMobile?10:16,padding:isMobile?'12px 14px':'16px 20px',cursor:'pointer',alignItems:'center'}} onClick={()=>setExpandedAuction(expandedAuction===a.id?null:a.id)}>
                      {a.image_url && <img src={a.image_url} alt="" style={{width:isMobile?40:50,height:isMobile?40:50,objectFit:'cover',borderRadius:'var(--radius)',flexShrink:0}}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:500,color:'var(--text-primary)',marginBottom:2,fontSize:isMobile?'0.8rem':'inherit',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                        <div style={{fontSize:isMobile?'0.62rem':'0.7rem',color:'var(--text-muted)'}}>
                          {a.brand} • {a.totalBids} {t.totalBids||'bids'}
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontWeight:600,color:'var(--gold)',fontSize:isMobile?'0.85rem':'1rem'}}>${Number(a.finalPrice).toLocaleString()}</div>
                        <div style={{fontSize:isMobile?'0.58rem':'0.65rem',color:a.winner?'#4cc9a8':'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:isMobile?90:'none'}}>{a.winner?(a.winner.profile?.name||a.winner.user_name):(t.noWinner||'No Winner')}</div>
                      </div>
                      <ChevronDown size={isMobile?14:16} style={{color:'var(--text-muted)',transform:expandedAuction===a.id?'rotate(180deg)':'',transition:'transform 0.2s',flexShrink:0}}/>
                    </div>
                    {expandedAuction===a.id && (
                      <div style={{padding:isMobile?'0 14px 14px':'0 20px 20px',borderTop:'1px solid var(--border-subtle)'}}>
                        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(auto-fit,minmax(200px,1fr))',gap:isMobile?10:16,paddingTop:isMobile?12:16}}>
                          <div>
                            <Label>{t.auctionStartDate||'Start Date'}</Label>
                            <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-primary)'}}>{new Date(a.start_date).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <Label>{t.auctionEndDate||'End Date'}</Label>
                            <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-primary)'}}>{new Date(a.end_date).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <Label>{t.startingPrice||'Starting Price'}</Label>
                            <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-primary)'}}>${Number(a.starting_price).toLocaleString()}</div>
                          </div>
                          <div>
                            <Label>{t.finalPrice||'Final Price'}</Label>
                            <div style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--gold)',fontWeight:600}}>${Number(a.finalPrice).toLocaleString()}</div>
                          </div>
                        </div>
                        {a.winner && a.winner.profile && (
                          <div style={{marginTop:isMobile?14:20,padding:isMobile?12:16,background:'rgba(201,168,76,0.05)',borderRadius:'var(--radius)',border:'1px solid rgba(201,168,76,0.15)'}}>
                            <Label>{t.winner||'Winner'}</Label>
                            <div style={{display:'flex',flexDirection:'column',gap:isMobile?8:10,marginTop:8}}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <Users size={isMobile?12:14} style={{color:'var(--gold)',flexShrink:0}}/>
                                <span style={{fontSize:isMobile?'0.75rem':'0.8rem',color:'var(--text-primary)',fontWeight:500}}>{a.winner.profile.name}</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <Mail size={isMobile?12:14} style={{color:'var(--gold)',flexShrink:0}}/>
                                <span style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.winner.profile.email}</span>
                              </div>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <Phone size={isMobile?12:14} style={{color:'var(--gold)',flexShrink:0}}/>
                                  <span style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-secondary)'}}>{a.winner.profile.phone||'—'}</span>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <MapPin size={isMobile?12:14} style={{color:'var(--gold)',flexShrink:0}}/>
                                  <span style={{fontSize:isMobile?'0.72rem':'0.8rem',color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.winner.profile.location||'—'}</span>
                                </div>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,padding:'8px 0',borderTop:'1px solid var(--border-subtle)'}}>
                                <DollarSign size={isMobile?12:14} style={{color:'var(--gold)',flexShrink:0}}/>
                                <span style={{fontSize:isMobile?'0.85rem':'0.9rem',fontWeight:700,color:'var(--gold)'}}>${Number(a.winner.amount).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div style={{display:'flex',gap:12,marginTop:isMobile?12:16,flexWrap:'wrap'}}>
                          {a.order ? (
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <StatusBadge status={a.order.status}/>
                              <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{a.order.order_number}</span>
                            </div>
                          ) : a.winner ? (
                            <span style={{fontSize:'0.68rem',color:'var(--text-muted)',fontStyle:'italic'}}>{t.pending||'Pending'} — {t.noOrders||'No order yet'}</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
          isMobile={isMobile} dir={dir} t={t}
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

      {/* ── Auction modal ── */}
      {auctionModal && (() => {
        const isEdit = auctionModal !== 'new'
        const initial = isEdit ? {
          name: auctionModal.name||'', brand: auctionModal.brand||'', description: auctionModal.description||'',
          images: auctionModal.images||[], starting_price: auctionModal.starting_price||'',
          min_increment: auctionModal.min_increment||50,
          start_date: toLocalDatetimeString(auctionModal.start_date),
          end_date: toLocalDatetimeString(auctionModal.end_date),
          enabled: auctionModal.enabled!==0,
        } : {
          name:'', brand:'', description:'', images:['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80'],
          starting_price:'', min_increment:50, start_date:'', end_date:'', enabled:true,
        }
        return <AuctionModal key={isEdit?auctionModal.id:'new'} initial={initial} isEdit={isEdit}
          uploadImage={uploadImage} t={t} isMobile={isMobile} dir={dir}
          onClose={()=>setAuctionModal(null)}
          onSave={async (data)=>{
            if(isEdit) await updateAuction(auctionModal.id, data)
            else await createAuction(data)
            setAuctionModal(null)
          }}
        />
      })()}

      {/* ── Delete auction confirm ── */}
      {deleteAuctionConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{maxWidth:340,padding:28,textAlign:'center',margin:16}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(224,68,68,0.1)',border:'1px solid rgba(224,68,68,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <Trash2 size={22} style={{color:'#e04444'}}/>
            </div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',marginBottom:8}}>{t.deleteAuction||'Delete Auction?'}</h3>
            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:24}}>
              This will permanently delete <strong style={{color:'var(--text-primary)'}}>{deleteAuctionConfirm.name}</strong> and all its bids.
            </p>
            <div style={{display:'flex',gap:12}}>
              <button className="btn btn-outline" style={{flex:1,padding:'12px'}} onClick={()=>setDeleteAuctionConfirm(null)}>{t.cancel||'Cancel'}</button>
              <button style={{flex:1,padding:'12px',background:'#e04444',color:'white',borderRadius:'var(--radius-sm)',fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',border:'none'}}
                onClick={async()=>{await deleteAuction(deleteAuctionConfirm.id);setDeleteAuctionConfirm(null)}}>
                {t.delete||'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Highlight Highest Bid Confirm Modal ── */}
      {highlightConfirm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{maxWidth:360,padding:24,textAlign:'center',margin:16}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(76,201,168,0.12)',border:'1px solid rgba(76,201,168,0.35)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              <CheckCheck size={22} style={{color:'#4cc9a8'}}/>
            </div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.15rem',marginBottom:8,fontWeight:400}}>
              {t.highlightConfirmTitle || 'Mark Current Highest Bid'}
            </h3>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:12,lineHeight:1.5}}>
              {t.highlightConfirmMessage || 'Highlight the current highest bid of'}{' '}
              <strong style={{color:'#4cc9a8'}}>${Number(highlightConfirm.current_highest_bid || highlightConfirm.starting_price).toLocaleString()}</strong>{' '}
              {t.forWatch || 'for'} <strong style={{color:'var(--text-primary)'}}>{highlightConfirm.name}</strong>?
            </p>
            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',background:'var(--bg-elevated)',padding:'8px 12px',borderRadius:'var(--radius-sm)',marginBottom:20,border:'1px solid var(--border-subtle)'}}>
              {t.highlightConfirmNote || 'The auction will remain LIVE and users can continue bidding normally.'}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-outline" style={{flex:1,padding:'10px',fontSize:'0.72rem'}} onClick={()=>setHighlightConfirm(null)}>
                {t.cancel || 'Cancel'}
              </button>
              <button
                style={{
                  flex:1,padding:'10px',background:'#4cc9a8',color:'#0a0a0a',
                  borderRadius:'var(--radius-sm)',fontSize:'0.72rem',fontWeight:700,
                  cursor:'pointer',border:'none',display:'flex',alignItems:'center',
                  justifyContent:'center',gap:6
                }}
                disabled={highlighting}
                onClick={async () => {
                  setHighlighting(true)
                  try {
                    await highlightHighestBid(highlightConfirm.id)
                    setHighlightConfirm(null)
                  } catch {} finally {
                    setHighlighting(false)
                  }
                }}
              >
                {highlighting ? (t.loading || 'Saving...') : (t.highlightBid || 'Highlight')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
