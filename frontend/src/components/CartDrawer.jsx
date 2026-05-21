import React from 'react'
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useNavigate } from 'react-router-dom'

export default function CartDrawer() {
  const { t, dir, cart, cartOpen, setCartOpen, removeFromCart, updateQty } = useStore()
  const navigate = useNavigate()
  if (!cartOpen) return null
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <>
      <div className="drawer-overlay" onClick={() => setCartOpen(false)}/>
      <div className="cart-drawer" dir={dir}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px',borderBottom:'1px solid var(--border-subtle)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <ShoppingBag size={18} style={{color:'var(--gold)'}}/>
            <span style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',fontWeight:400}}>{t.cart}</span>
            {cart.length>0&&<span style={{background:'var(--gold)',color:'var(--bg-primary)',borderRadius:10,padding:'1px 8px',fontSize:'0.65rem',fontWeight:700}}>{cart.reduce((s,i)=>s+i.qty,0)}</span>}
          </div>
          <button onClick={()=>setCartOpen(false)} style={{width:34,height:34,borderRadius:'50%',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-secondary)'}}>
            <X size={15}/>
          </button>
        </div>

        {/* Items */}
        <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
          {cart.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
              <ShoppingBag size={40} style={{margin:'0 auto 14px',opacity:0.3}}/>
              <p style={{fontSize:'0.85rem'}}>{t.emptyCart}</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{display:'flex',gap:12,padding:'14px 0',borderBottom:'1px solid var(--border-subtle)'}}>
              <div style={{width:64,height:64,borderRadius:'var(--radius-sm)',overflow:'hidden',background:'var(--bg-secondary)',flexShrink:0}}>
                <img src={item.images?.[0]||item.image||''} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:2}}>{item.brand_name||item.brand||''}</div>
                <div style={{fontSize:'0.82rem',fontWeight:500,color:'var(--text-primary)',marginBottom:6,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.name}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',overflow:'hidden'}}>
                    <button onClick={()=>updateQty(item.id,item.qty-1)} style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'1rem'}}>−</button>
                    <span style={{width:28,textAlign:'center',fontSize:'0.82rem',fontWeight:500}}>{item.qty}</span>
                    <button onClick={()=>updateQty(item.id,item.qty+1)} style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',fontSize:'1rem'}}>+</button>
                  </div>
                  <span style={{fontSize:'0.85rem',fontWeight:600,color:'var(--off-white)'}}>${(item.price*item.qty).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={()=>removeFromCart(item.id)} style={{color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer',padding:'4px',flexShrink:0,alignSelf:'flex-start'}}
                onMouseEnter={e=>e.currentTarget.style.color='#e04444'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length>0&&(
          <div style={{padding:'16px 20px',borderTop:'1px solid var(--border-subtle)',flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>{t.total}</span>
              <span style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',color:'var(--off-white)'}}>${total.toLocaleString()}</span>
            </div>
            <button className="btn btn-gold" style={{width:'100%',padding:'14px',fontSize:'0.72rem',letterSpacing:'0.12em'}}
              onClick={()=>{setCartOpen(false);navigate('/checkout')}}>
              {t.checkout} <ArrowRight size={14}/>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
