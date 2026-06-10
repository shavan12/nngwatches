import React from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product, style }) {
  const { t, addToCart, toggleWishlist, isInWishlist } = useStore()
  const navigate = useNavigate()
  const inWish = isInWishlist(product.id)
  const img = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80'
  const price = product.price ?? product.price
  const origPrice = product.original_price ?? product.originalPrice
  const inStock = product.in_stock ?? product.inStock
  const isNew = product.is_new ?? product.isNew
  const brandName = product.brand_name ?? product.brand ?? ''

  return (
    <div className="product-card" style={style} onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-card-img">
        <img src={img} alt={product.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        <div style={{position:'absolute',top:8,left:8,display:'flex',flexDirection:'column',gap:4}}>
          {isNew && <span className="tag tag-new">New</span>}
          {origPrice && <span className="tag tag-gold">-{Math.round((1-price/origPrice)*100)}%</span>}
          {!inStock && <span style={{background:'rgba(224,68,68,0.15)',color:'#e04444',fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',padding:'4px 10px',borderRadius:4,border:'1px solid rgba(224,68,68,0.4)'}}>Sold Out</span>}
        </div>
        <button className="product-card-wishlist" onClick={e=>{e.stopPropagation();toggleWishlist(product)}} style={{color:inWish?'var(--gold)':'var(--text-secondary)'}}>
          <Heart size={14} fill={inWish?'var(--gold)':'none'}/>
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-card-brand">{brandName}</div>
        <div className="product-card-name">{product.name}</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div>
            <span className="product-card-price">${Number(price).toLocaleString()}</span>
            {origPrice && <span style={{fontSize:'0.72rem',color:'#e04444',textDecoration:'line-through',marginLeft:8}}>${Number(origPrice).toLocaleString()}</span>}
          </div>
          {inStock && (
            <button className="btn-ghost" style={{padding:'6px',borderRadius:'50%',background:'var(--bg-elevated)',transition:'var(--transition)',flexShrink:0}}
              onClick={e=>{e.stopPropagation();addToCart(product)}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--gold-muted)';e.currentTarget.style.color='var(--gold)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-elevated)';e.currentTarget.style.color=''}}>
              <ShoppingBag size={14}/>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
