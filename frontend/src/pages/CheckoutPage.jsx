import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useStore } from '../context/StoreContext'

export default function CheckoutPage() {
  const { t, dir, cart, clearCart, placeOrder, user } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    customer_name:    user?.name  || '',
    customer_email:   user?.email || '',
    customer_phone:   user?.phone || '',
    shipping_address: '',
    city:             '',
    country:          '',
    notes:            '',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(null)

  const set = (k, v) => setForm(f => ({...f, [k]:v}))
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal >= 5000 ? 0 : 150
  const total    = subtotal + shipping

  const inp = {width:'100%',padding:'12px 14px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'16px',outline:'none',fontFamily:'var(--font-body)'}
  const lbl = {display:'block',fontSize:'0.62rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}

  const handleSubmit = async e => {
    e.preventDefault()
    if (cart.length === 0) { setError('Your cart is empty'); return }
    setLoading(true); setError('')
    try {
      const res = await placeOrder({
        ...form,
        items: cart.map(i => ({ product_id:i.id, quantity:i.qty })),
      })
      setSuccess(res)
      clearCart()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (success) return (
    <div dir={dir} style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px'}}>
      <div style={{textAlign:'center',maxWidth:480}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(76,201,168,0.1)',border:'2px solid #4cc9a8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}>
          <Check size={32} style={{color:'#4cc9a8'}}/>
        </div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:300,color:'var(--off-white)',marginBottom:12}}>{t.orderSuccess}</h1>
        <p style={{color:'var(--text-muted)',marginBottom:8}}>Order number: <strong style={{color:'var(--gold)'}}>{success.order_number}</strong></p>
        <p style={{color:'var(--text-muted)',marginBottom:32}}>Total: <strong style={{color:'var(--off-white)'}}>${Number(success.total).toLocaleString()}</strong></p>
        <button className="btn btn-gold" style={{padding:'14px 32px'}} onClick={()=>navigate('/shop')}>Continue Shopping</button>
      </div>
    </div>
  )

  if (cart.length === 0) return (
    <div dir={dir} style={{textAlign:'center',padding:'120px 20px'}}>
      <ShoppingBag size={48} style={{color:'var(--text-muted)',margin:'0 auto 16px'}}/>
      <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',fontWeight:300,marginBottom:16,color:'var(--off-white)'}}>{t.emptyCart}</h2>
      <button className="btn btn-gold" onClick={()=>navigate('/shop')}>Browse Watches</button>
    </div>
  )

  return (
    <div dir={dir} style={{padding:'40px 0 80px'}}>
      <div className="container" style={{maxWidth:900}}>
        <button onClick={()=>navigate(-1)} style={{display:'flex',alignItems:'center',gap:8,color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer',fontSize:'0.8rem',marginBottom:24}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
          <ArrowLeft size={14}/> Back
        </button>

        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.6rem,4vw,2.2rem)',fontWeight:300,color:'var(--off-white)',marginBottom:32}}>Checkout</h1>

        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:28}}>
          {/* Form */}
          <form onSubmit={handleSubmit} style={{display:'grid',gap:16}}>
            {error&&<div style={{padding:'10px 14px',background:'rgba(224,68,68,0.08)',border:'1px solid rgba(224,68,68,0.25)',borderRadius:'var(--radius-sm)',fontSize:'0.8rem',color:'#e04444'}}>{error}</div>}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><label style={lbl}>{t.fullName} *</label><input style={inp} value={form.customer_name} onChange={e=>set('customer_name',e.target.value)} required/></div>
              <div><label style={lbl}>{t.email} *</label><input style={inp} type="email" value={form.customer_email} onChange={e=>set('customer_email',e.target.value)} required/></div>
            </div>
            <div><label style={lbl}>{t.phone}</label><input style={inp} value={form.customer_phone} onChange={e=>set('customer_phone',e.target.value)}/></div>
            <div><label style={lbl}>{t.address} *</label><input style={inp} value={form.shipping_address} onChange={e=>set('shipping_address',e.target.value)} required/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div><label style={lbl}>{t.city} *</label><input style={inp} value={form.city} onChange={e=>set('city',e.target.value)} required/></div>
              <div><label style={lbl}>{t.country} *</label><input style={inp} value={form.country} onChange={e=>set('country',e.target.value)} required/></div>
            </div>
            <div><label style={lbl}>Notes</label><textarea style={{...inp,resize:'vertical'}} rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>

            {/* Order summary */}
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',overflow:'hidden'}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border-subtle)',fontSize:'0.8rem',fontWeight:600}}>{t.orderSummary}</div>
              <div style={{padding:'14px 18px'}}>
                {cart.map(item=>(
                  <div key={item.id} style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:'0.82rem'}}>
                    <span style={{color:'var(--text-secondary)'}}>{item.name} ×{item.qty}</span>
                    <span style={{color:'var(--text-primary)',fontWeight:500}}>${(item.price*item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{borderTop:'1px solid var(--border-subtle)',paddingTop:10,marginTop:4}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:'0.8rem'}}>
                    <span style={{color:'var(--text-muted)'}}>{t.subtotal}</span>
                    <span style={{color:'var(--text-secondary)'}}>${subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:'0.8rem'}}>
                    <span style={{color:'var(--text-muted)'}}>Shipping</span>
                    <span style={{color:shipping===0?'#4cc9a8':'var(--text-secondary)'}}>{shipping===0?'Free':`$${shipping}`}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'1rem',fontWeight:600}}>
                    <span style={{color:'var(--text-primary)'}}>{t.total}</span>
                    <span style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',color:'var(--gold)'}}>${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-gold" style={{padding:'15px',fontSize:'0.75rem',letterSpacing:'0.12em'}} disabled={loading}>
              {loading ? 'Placing Order...' : <>{t.placeOrder} <Check size={15}/></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
