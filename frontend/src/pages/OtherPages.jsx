import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

export function WishlistPage() {
  const { t, dir, wishlist } = useStore()
  const navigate = useNavigate()
  return (
    <div dir={dir} style={{padding:'40px 0 80px'}}>
      <div className="container">
        <div className="section-label" style={{marginBottom:8}}>My Collection</div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.6rem,4vw,2.4rem)',fontWeight:300,color:'var(--off-white)',marginBottom:32}}>{t.wishlist}</h1>
        {wishlist.length===0 ? (
          <div style={{textAlign:'center',padding:'80px 20px'}}>
            <Heart size={48} style={{color:'var(--text-muted)',margin:'0 auto 16px'}}/>
            <p style={{color:'var(--text-muted)',marginBottom:24}}>{t.emptyWishlist}</p>
            <button className="btn btn-gold" onClick={()=>navigate('/shop')}>Browse Watches</button>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.map(p=><ProductCard key={p.id} product={p}/>)}
          </div>
        )}
      </div>
    </div>
  )
}

export function BrandsPage() {
  const { dir, brands } = useStore()
  const navigate = useNavigate()
  return (
    <div dir={dir} style={{padding:'40px 0 80px'}}>
      <div className="container">
        <div className="section-label" style={{marginBottom:8}}>Our Partners</div>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.6rem,4vw,2.4rem)',fontWeight:300,color:'var(--off-white)',marginBottom:40}}>Luxury Brands</h1>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
          {brands.map(brand=>(
            <button key={brand.id} onClick={()=>navigate(`/shop?brand=${encodeURIComponent(brand.name)}`)}
              style={{padding:'24px',background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',textAlign:'left',cursor:'pointer',transition:'var(--transition)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.background='var(--gold-muted)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.background='var(--bg-card)'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',fontWeight:400,color:'var(--off-white)',marginBottom:6}}>{brand.name}</div>
              {brand.founded&&<div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginBottom:4}}>Est. {brand.founded} · {brand.origin}</div>}
              <div style={{fontSize:'0.72rem',color:'var(--gold)'}}>{brand.product_count||0} watches</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
