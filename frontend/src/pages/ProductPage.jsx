import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Share2, ChevronLeft, ChevronRight, Star, Check, Loader, ArrowLeft, X, ZoomIn } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

// ── Inject modal CSS once ─────────────────────────────────
let _cssInjected = false
function injectCSS() {
  if (_cssInjected) return; _cssInjected = true
  const s = document.createElement('style')
  s.textContent = `
    @keyframes _mIn  { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
    @keyframes _mOut { from{opacity:1;transform:scale(1)}    to{opacity:0;transform:scale(0.93)} }
    @keyframes _bgIn { from{opacity:0} to{opacity:1} }
    ._modal-bg  { animation:_bgIn .22s ease }
    ._modal-img { animation:_mIn .28s cubic-bezier(.34,1.4,.64,1) }
    ._modal-img.out { animation:_mOut .18s ease forwards }
    ._img-switch { animation:_mIn .22s ease }
    ._nav-btn:hover { background:rgba(255,255,255,.18)!important }
    ._thumb:hover   { opacity:1!important; transform:scale(1.06) }
    ._close:hover   { background:rgba(255,255,255,.18)!important; transform:rotate(90deg) }
    ._close { transition:transform .2s,background .15s }
    ._nav-btn { transition:background .15s }
    ._thumb   { transition:opacity .15s,transform .15s,border-color .15s }
    ._prod-img:hover img { transform:scale(1.05) }
    ._prod-img img { transition:transform .45s ease }
  `
  document.head.appendChild(s)
}

// ── Image Modal ───────────────────────────────────────────
function ImageModal({ images, startIndex, onClose }) {
  injectCSS()
  const [idx, setIdx]       = useState(startIndex)
  const [out, setOut]       = useState(false)
  const [switching, setSwitch] = useState(false)
  const t0x = useRef(null)

  const close = useCallback(() => {
    setOut(true); setTimeout(onClose, 170)
  }, [onClose])

  const goTo = useCallback((n) => {
    if (switching) return
    setSwitch(true)
    setTimeout(() => { setIdx(n); setSwitch(false) }, 160)
  }, [switching])

  const prev = () => goTo((idx - 1 + images.length) % images.length)
  const next = () => goTo((idx + 1) % images.length)

  useEffect(() => {
    const h = e => {
      if (e.key==='Escape') close()
      if (e.key==='ArrowLeft' && images.length>1) prev()
      if (e.key==='ArrowRight' && images.length>1) next()
    }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [idx, switching])

  const onTS = e => { t0x.current = e.touches[0].clientX }
  const onTE = e => {
    if (t0x.current === null || images.length < 2) return
    const dx = t0x.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 45) dx > 0 ? next() : prev()
    t0x.current = null
  }

  const isMob = window.innerWidth < 768

  return (
    <div className="_modal-bg" onClick={close}
      onTouchStart={onTS} onTouchEnd={onTE}
      style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,0.97)', backdropFilter:'blur(16px)', display:'flex', flexDirection:'column' }}>

      {/* top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', flexShrink:0 }}
        onClick={e=>e.stopPropagation()}>
        <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>
          {images.length > 1 ? `${idx+1} / ${images.length}` : ''}
        </span>
        <button className="_close" onClick={e=>{e.stopPropagation();close()}}
          style={{ width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.09)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
          <X size={18}/>
        </button>
      </div>

      {/* image + arrows */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding: isMob ? 0 : '0 56px' }}
        onClick={e=>e.stopPropagation()}>

        {images.length > 1 && (
          <button className="_nav-btn" onClick={prev}
            style={{ position:'absolute', left: isMob?6:8, zIndex:10, width: isMob?42:50, height: isMob?42:50, borderRadius:'50%', background:'rgba(255,255,255,0.09)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <ChevronLeft size={isMob?20:24}/>
          </button>
        )}

        <div className={`_modal-img${out?' out':''}`}
          style={{ maxWidth: isMob?'100vw':'min(78vw,840px)', maxHeight:'calc(100vh - 190px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img key={idx}
            src={images[idx]} alt=""
            className={switching ? '_img-switch' : ''}
            style={{ maxWidth: isMob?'100vw':'min(78vw,840px)', maxHeight:'calc(100vh - 190px)', width:'auto', height:'auto', objectFit:'contain', borderRadius: isMob?0:12, display:'block', userSelect:'none', WebkitUserDrag:'none' }}
            draggable={false}/>
        </div>

        {images.length > 1 && (
          <button className="_nav-btn" onClick={next}
            style={{ position:'absolute', right: isMob?6:8, zIndex:10, width: isMob?42:50, height: isMob?42:50, borderRadius:'50%', background:'rgba(255,255,255,0.09)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <ChevronRight size={isMob?20:24}/>
          </button>
        )}
      </div>

      {/* thumbnails */}
      {images.length > 1 && (
        <div style={{ flexShrink:0, padding:'14px 16px 18px', display:'flex', justifyContent:'center', gap:8, overflowX:'auto', scrollbarWidth:'none' }}
          onClick={e=>e.stopPropagation()}>
          {images.map((img, i) => (
            <button key={i} className="_thumb" onClick={()=>goTo(i)}
              style={{ width:isMob?50:60, height:isMob?50:60, flexShrink:0, borderRadius:8, overflow:'hidden', border:`2px solid ${i===idx?'#c9a84c':'rgba(255,255,255,0.18)'}`, opacity:i===idx?1:0.5, background:'none', padding:0, cursor:'pointer' }}>
              <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
            </button>
          ))}
        </div>
      )}

      {!isMob && (
        <div style={{ textAlign:'center', paddingBottom:12, fontSize:11, color:'rgba(255,255,255,0.18)', letterSpacing:'0.06em' }}>
          ← → navigate &nbsp;·&nbsp; ESC close
        </div>
      )}
    </div>
  )
}

// ── Main product page ─────────────────────────────────────
export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, dir, api, addToCart, toggleWishlist, isInWishlist, openWhatsApp, products } = useStore()

  const [product,   setProduct]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [qty,       setQty]       = useState(1)
  const [added,     setAdded]     = useState(false)
  const [modal,     setModal]     = useState(false)

  // swipe on gallery (not modal)
  const t0x = useRef(null)
  const swipeHandled = useRef(false)

  useEffect(() => {
    setLoading(true); setError(''); setActiveImg(0); setAdded(false); setQty(1); setModal(false)
    api(`/products/${id}`)
      .then(d => setProduct(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
  }, [id])

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Loader size={32} style={{ color:'var(--gold)', animation:'spin 1s linear infinite' }}/>
    </div>
  )
  if (error || !product) return (
    <div style={{ textAlign:'center', padding:'120px 20px' }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, marginBottom:16, color:'var(--off-white)' }}>{error || 'Product not found'}</h2>
      <button className="btn btn-gold" onClick={()=>navigate('/shop')}>Back to Shop</button>
    </div>
  )

  const images  = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80']
  const inWish  = isInWishlist(product.id)
  const related = products.filter(p => p.id!==product.id && (p.brand_name===product.brand_name||p.category_slug===product.category_slug)).slice(0,4)

  const handleAddToCart = () => {
    for (let i=0;i<qty;i++) addToCart(product)
    setAdded(true); setTimeout(()=>setAdded(false), 2000)
  }

  const specs = [
    { label:t.reference,       value:product.reference },
    { label:t.movement,        value:product.movement },
    { label:t.caseMaterial,    value:product.case_material },
    { label:t.diameter,        value:product.diameter },
    { label:t.waterResistance, value:product.water_resistance },
  ].filter(s => s.value && s.value!=='none')

  // gallery swipe handlers — prevent opening modal on swipe
  const onGalleryTouchStart = e => {
    t0x.current = e.touches[0].clientX
    swipeHandled.current = false
  }
  const onGalleryTouchEnd = e => {
    if (t0x.current===null) return
    const dx = t0x.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) {
      swipeHandled.current = true
      dx>0
        ? setActiveImg(i=>(i+1)%images.length)
        : setActiveImg(i=>(i-1+images.length)%images.length)
    }
    t0x.current = null
  }
  const onGalleryClick = () => {
    if (!swipeHandled.current) setModal(true)
    swipeHandled.current = false
  }

  return (
    <div dir={dir} style={{ paddingBottom:60 }}>

      {/* sticky top bar */}
      <div style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'rgba(10,10,10,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border-subtle)' }}>
        <button onClick={()=>navigate(-1)} style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', cursor:'pointer', flexShrink:0 }}>
          <ArrowLeft size={15}/>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'0.6rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)' }}>{product.brand_name}</div>
          <div style={{ fontSize:'0.85rem', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{product.name}</div>
        </div>
        <button onClick={()=>toggleWishlist(product)} style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          <Heart size={15} fill={inWish?'var(--gold)':'none'} color={inWish?'var(--gold)':'var(--text-secondary)'}/>
        </button>
        <button onClick={()=>navigator.share?.({title:product.name,url:window.location.href})} style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', cursor:'pointer', flexShrink:0 }}>
          <Share2 size={14}/>
        </button>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hide-mobile">
        <div className="container" style={{ paddingTop:36, paddingBottom:60 }}>
          {/* breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28, fontSize:'0.72rem', color:'var(--text-muted)' }}>
            {[['Home','/'],['Shop','/shop'],[product.name,null]].map(([label,path],i)=>(
              <React.Fragment key={i}>
                {i>0&&<span>/</span>}
                {path
                  ? <button onClick={()=>navigate(path)} style={{ color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontSize:'0.72rem' }} onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>{label}</button>
                  : <span style={{ color:'var(--text-secondary)' }}>{label}</span>}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(28px,5vw,64px)', alignItems:'start' }}>
            {/* gallery */}
            <div>
              <div className="_prod-img" onClick={onGalleryClick}
                style={{ position:'relative', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--bg-secondary)', aspectRatio:'1', marginBottom:12, cursor:'zoom-in' }}>
                <img src={images[activeImg]} alt={product.name} key={activeImg}
                  style={{ width:'100%', height:'100%', objectFit:'cover', animation:'fadeIn 0.3s ease' }}/>
                {product.is_new && <span className="tag tag-new" style={{ position:'absolute', top:14, left:14 }}>New</span>}
                {!product.in_stock && <span style={{ position:'absolute', top:14, left:14, background:'rgba(0,0,0,0.75)', color:'#e04444', fontSize:'0.6rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', borderRadius:2 }}>Sold Out</span>}
                {/* zoom hint */}
                <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', borderRadius:20, padding:'5px 11px', display:'flex', alignItems:'center', gap:5, fontSize:'0.62rem', color:'rgba(255,255,255,0.7)', pointerEvents:'none' }}>
                  <ZoomIn size={11}/> Click to zoom
                </div>
                {images.length>1&&(
                  <>
                    <button onClick={e=>{e.stopPropagation();setActiveImg(i=>(i-1+images.length)%images.length)}} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><ChevronLeft size={17}/></button>
                    <button onClick={e=>{e.stopPropagation();setActiveImg(i=>(i+1)%images.length)}} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><ChevronRight size={17}/></button>
                  </>
                )}
              </div>
              {images.length>1&&(
                <div style={{ display:'flex', gap:8 }}>
                  {images.map((img,i)=>(
                    <button key={i} onClick={()=>setActiveImg(i)}
                      style={{ flex:1, aspectRatio:'1', borderRadius:'var(--radius-sm)', overflow:'hidden', border:`2px solid ${i===activeImg?'var(--gold)':'var(--border-subtle)'}`, cursor:'pointer', background:'var(--bg-secondary)', padding:0, transition:'border-color 0.2s' }}>
                      <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* details */}
            <div>
              <div style={{ fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', marginBottom:8 }}>{product.brand_name}</div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:300, color:'var(--off-white)', lineHeight:1.15, marginBottom:12 }}>{product.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ display:'flex', gap:2 }}>{[...Array(5)].map((_,i)=><Star key={i} size={12} fill={i<Math.floor(Number(product.rating))?'var(--gold)':'none'} stroke="var(--gold)"/>)}</div>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{product.rating} ({product.reviews_count} reviews)</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:6 }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:400, color:'var(--off-white)' }}>${Number(product.price).toLocaleString()}</span>
                {product.original_price&&<span style={{ fontSize:'1rem', color:'var(--text-muted)', textDecoration:'line-through' }}>${Number(product.original_price).toLocaleString()}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, fontSize:'0.72rem', color:product.in_stock?'#4cc9a8':'#e04444' }}>
                {product.in_stock?<><Check size={13}/>{t.inStock}</>:t.outOfStock}
              </div>
              {specs.length>0&&(
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                  {specs.slice(0,4).map(s=>(
                    <div key={s.label} style={{ padding:'5px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:20, fontSize:'0.68rem', color:'var(--text-secondary)' }}>
                      <span style={{ color:'var(--text-muted)', marginRight:4 }}>{s.label}:</span>{s.value}
                    </div>
                  ))}
                </div>
              )}
              {product.in_stock&&(
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{t.quantity}</span>
                  <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',fontSize:'1.1rem' }}>−</button>
                    <span style={{ width:40,textAlign:'center',fontSize:'0.9rem',fontWeight:500,color:'var(--text-primary)' }}>{qty}</span>
                    <button onClick={()=>setQty(q=>q+1)} style={{ width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',fontSize:'1.1rem' }}>+</button>
                  </div>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {product.in_stock&&(
                  <button className="btn btn-gold" style={{ padding:'14px', fontSize:'0.72rem', letterSpacing:'0.15em', width:'100%' }} onClick={handleAddToCart}>
                    {added?<><Check size={16}/>{t.addedToCart}</>:<><ShoppingBag size={16}/>{t.addToCart}</>}
                  </button>
                )}
                <button className="btn btn-outline" style={{ padding:'14px', fontSize:'0.7rem', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }} onClick={()=>openWhatsApp(product)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  {product.in_stock?t.whatsappBtn:'Inquire About Availability'}
                </button>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-outline" style={{ flex:1, padding:'10px', fontSize:'0.68rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={()=>toggleWishlist(product)}>
                    <Heart size={14} fill={inWish?'var(--gold)':'none'} color={inWish?'var(--gold)':'currentColor'}/>{t.wishlist}
                  </button>
                  <button className="btn btn-outline" style={{ flex:1, padding:'10px', fontSize:'0.68rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={()=>navigator.share?.({title:product.name,url:window.location.href})}>
                    <Share2 size={14}/>{t.share}
                  </button>
                </div>
              </div>
              {/* <div style={{ display:'flex', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)' }}>
                {['✓ 100% Authentic','✓ Insured Shipping','✓ 14-Day Returns'].map((b,i)=>(
                  <span key={b} style={{ flex:1, padding:'10px 4px', textAlign:'center', fontSize:'0.65rem', color:'var(--text-muted)', borderRight:i<2?'1px solid var(--border-subtle)':'none' }}>{b}</span>
                ))}
              </div> */}
            </div>
          </div>

          {/* tabs */}
          <div style={{ marginTop:56 }}>
            <div style={{ display:'flex', borderBottom:'1px solid var(--border-subtle)', marginBottom:28 }}>
              {[{key:'description',label:t.description},{key:'specs',label:t.specifications}].map(tab=>(
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                  style={{ padding:'12px 24px', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', background:'none', border:'none', cursor:'pointer', color:activeTab===tab.key?'var(--gold)':'var(--text-muted)', borderBottom:`2px solid ${activeTab===tab.key?'var(--gold)':'transparent'}`, marginBottom:-1, transition:'color 0.2s' }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab==='description'&&<p style={{ maxWidth:700, fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.9 }}>{product.description||'No description available.'}</p>}
            {activeTab==='specs'&&(
              <table style={{ maxWidth:560, width:'100%', borderCollapse:'collapse' }}>
                <tbody>{specs.map(s=>(
                  <tr key={s.label} style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                    <td style={{ padding:'13px 0', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', width:'40%' }}>{s.label}</td>
                    <td style={{ padding:'13px 0', fontSize:'0.85rem', color:'var(--text-primary)' }}>{s.value}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>

          {related.length>0&&(
            <div style={{ marginTop:72 }}>
              <div className="section-label" style={{ marginBottom:8 }}>{t.relatedProducts}</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:300, color:'var(--off-white)', marginBottom:28 }}>You May Also Like</h2>
              <div className="product-grid">{related.map(p=><ProductCard key={p.id} product={p}/>)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE layout ── */}
      <div className="show-mobile">
        {/* gallery */}
        <div style={{ position:'relative', background:'var(--bg-secondary)', aspectRatio:'1', overflow:'hidden', cursor:'zoom-in' }}
          onTouchStart={onGalleryTouchStart}
          onTouchEnd={onGalleryTouchEnd}
          onClick={onGalleryClick}>
          <img src={images[activeImg]} alt={product.name} key={activeImg}
            style={{ width:'100%', height:'100%', objectFit:'cover', animation:'fadeIn 0.3s ease' }}/>
          <div style={{ position:'absolute', top:12, left:12, display:'flex', flexDirection:'column', gap:6 }}>
            {product.is_new&&<span className="tag tag-new">New</span>}
            {!product.in_stock&&<span style={{ background:'rgba(0,0,0,0.8)', color:'#e04444', fontSize:'0.6rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', borderRadius:2 }}>Sold Out</span>}
          </div>
          {images.length>1&&(
            <div style={{ position:'absolute', bottom:12, left:0, right:0, display:'flex', justifyContent:'center', gap:6 }}>
              {images.map((_,i)=>(
                <div key={i} style={{ width:i===activeImg?20:6, height:6, borderRadius:3, background:i===activeImg?'var(--gold)':'rgba(255,255,255,0.4)', transition:'all 0.2s' }}/>
              ))}
            </div>
          )}
          <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', borderRadius:20, padding:'4px 10px', display:'flex', alignItems:'center', gap:4, fontSize:'0.6rem', color:'rgba(255,255,255,0.7)', pointerEvents:'none' }}>
            <ZoomIn size={10}/> Tap
          </div>
        </div>

        {/* thumbnail strip */}
        {images.length>1&&(
          <div style={{ display:'flex', gap:8, padding:'10px 14px', overflowX:'auto', background:'var(--bg-secondary)', scrollbarWidth:'none' }}>
            {images.map((img,i)=>(
              <button key={i} onClick={()=>setActiveImg(i)}
                style={{ width:54, height:54, flexShrink:0, borderRadius:'var(--radius-sm)', overflow:'hidden', border:`2px solid ${i===activeImg?'var(--gold)':'transparent'}`, transition:'border-color 0.2s', cursor:'pointer', background:'none', padding:0 }}>
                <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
              </button>
            ))}
          </div>
        )}

        {/* info */}
        <div style={{ padding:'18px 16px 0' }}>
          <div style={{ fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', marginBottom:6 }}>{product.brand_name}</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,6vw,2.2rem)', fontWeight:300, color:'var(--off-white)', lineHeight:1.15, marginBottom:10 }}>{product.name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ display:'flex', gap:2 }}>{[...Array(5)].map((_,i)=><Star key={i} size={12} fill={i<Math.floor(Number(product.rating))?'var(--gold)':'none'} stroke="var(--gold)"/>)}</div>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{product.rating} ({product.reviews_count} reviews)</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:6 }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:400, color:'var(--off-white)' }}>${Number(product.price).toLocaleString()}</span>
            {product.original_price&&<span style={{ fontSize:'1rem', color:'var(--text-muted)', textDecoration:'line-through' }}>${Number(product.original_price).toLocaleString()}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16, fontSize:'0.72rem', color:product.in_stock?'#4cc9a8':'#e04444' }}>
            {product.in_stock?<><Check size={13}/>{t.inStock}</>:t.outOfStock}
          </div>
          {specs.length>0&&(
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
              {specs.slice(0,4).map(s=>(
                <div key={s.label} style={{ padding:'5px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:20, fontSize:'0.68rem', color:'var(--text-secondary)' }}>
                  <span style={{ color:'var(--text-muted)', marginRight:4 }}>{s.label}:</span>{s.value}
                </div>
              ))}
            </div>
          )}
          {product.in_stock&&(
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
              <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{t.quantity}</span>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>−</button>
                <span style={{ width:44,textAlign:'center',fontSize:'1rem',fontWeight:500,color:'var(--text-primary)' }}>{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} style={{ width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* action buttons */}
        <div style={{ padding:'0 16px 14px', display:'flex', flexDirection:'column', gap:10 }}>
          {product.in_stock&&(
            <button className="btn btn-gold" style={{ width:'100%', padding:'15px', fontSize:'0.75rem', letterSpacing:'0.12em' }} onClick={handleAddToCart}>
              {added?<><Check size={16}/>{t.addedToCart}</>:<><ShoppingBag size={16}/>{t.addToCart}</>}
            </button>
          )}
          <button className="btn btn-outline" style={{ width:'100%', padding:'15px', fontSize:'0.72rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }} onClick={()=>openWhatsApp(product)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            {product.in_stock?t.whatsappBtn:'Inquire About Availability'}
          </button>
        </div>

        {/* trust bar */}
        {/* <div style={{ margin:'0 16px 20px', display:'flex', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)' }}>
          {['✓ Authentic','✓ Insured','✓ 14-Day Return'].map((b,i)=>(
            <span key={b} style={{ flex:1, padding:'10px 4px', textAlign:'center', fontSize:'0.62rem', color:'var(--text-muted)', borderRight:i<2?'1px solid var(--border-subtle)':'none' }}>{b}</span>
          ))}
        </div> */}

        {/* tabs */}
        <div style={{ padding:'0 16px 36px' }}>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border-subtle)', marginBottom:18 }}>
            {[{key:'description',label:t.description},{key:'specs',label:t.specifications}].map(tab=>(
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                style={{ padding:'12px 20px', fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', background:'none', border:'none', cursor:'pointer', color:activeTab===tab.key?'var(--gold)':'var(--text-muted)', borderBottom:`2px solid ${activeTab===tab.key?'var(--gold)':'transparent'}`, marginBottom:-1, transition:'color 0.2s' }}>
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab==='description'&&<p style={{ fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.9 }}>{product.description||'No description.'}</p>}
          {activeTab==='specs'&&(
            <div>{specs.map(s=>(
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                <span style={{ fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontSize:'0.85rem', color:'var(--text-primary)' }}>{s.value}</span>
              </div>
            ))}</div>
          )}
        </div>

        {related.length>0&&(
          <div style={{ padding:'0 16px 80px', borderTop:'1px solid var(--border-subtle)', paddingTop:28 }}>
            <div className="section-label" style={{ marginBottom:8 }}>{t.relatedProducts}</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.3rem,5vw,1.8rem)', fontWeight:300, color:'var(--off-white)', marginBottom:18 }}>You May Also Like</h2>
            <div className="product-grid">{related.map(p=><ProductCard key={p.id} product={p}/>)}</div>
          </div>
        )}
      </div>

      {/* modal */}
      {modal && <ImageModal images={images} startIndex={activeImg} onClose={()=>setModal(false)}/>}
    </div>
  )
}
