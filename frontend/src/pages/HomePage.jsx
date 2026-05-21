import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

export default function HomePage() {
  const { t, dir, products, api } = useStore()
  const navigate = useNavigate()
  const [currentSlide,  setCurrentSlide]  = useState(0)
  const [slides,        setSlides]        = useState([])
  const [slidesLoading, setSlidesLoading] = useState(true)

  const featured    = products.filter(p => p.isFeatured || p.is_featured).slice(0, 8)
  const newArrivals = products.filter(p => p.isNew     || p.is_new).slice(0, 4)

  const fallbackSlides = [
    { id:1, title_en:'Timeless Elegance', title_ar:'أناقة خالدة', subtitle_en:"Discover the world's finest luxury timepieces.", subtitle_ar:'اكتشف أرقى الساعات الفاخرة في العالم.', cta_en:'Explore Collection', cta_ar:'استكشف المجموعة', image_url:'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1400&q=85' },
    { id:2, title_en:'The Art of Time',   title_ar:'فن صناعة الوقت', subtitle_en:'From iconic dress watches to legendary sport timepieces.', subtitle_ar:'من الساعات الرسمية الأيقونية إلى الرياضية الأسطورية.', cta_en:'Shop Now', cta_ar:'تسوق الآن', image_url:'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1400&q=85' },
    { id:3, title_en:'Heritage & Craftsmanship', title_ar:'الإرث والحرفية', subtitle_en:'Every watch tells a story of centuries of mastery.', subtitle_ar:'كل ساعة تحكي قصة قرون من الإتقان.', cta_en:'View Brands', cta_ar:'عرض الماركات', image_url:'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1400&q=85' },
  ]

  useEffect(() => {
    api('/slides')
      .then(res => setSlides(res.data?.length ? res.data : fallbackSlides))
      .catch(() => setSlides(fallbackSlides))
      .finally(() => setSlidesLoading(false))
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setCurrentSlide(s => (s+1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => { setCurrentSlide(0) }, [slides.length])

  const categoryCards = [
    { key:'dress',   label: dir==='rtl'?'رسمية':'Dress',      img:'https://www.ferrowatches.com/cdn/shop/files/ROMANBLACKHERO_de46cd46-440e-4eb0-8fea-9d522180c94d.jpg?v=1614292481&width=1920' },
    { key:'Casual',   label: dir==='rtl'?'كاجوال':'Casual',     img:'https://www.claireandclara.com/cdn/shop/products/concept-gentleman-luxury-casual-watch-watches-claire-clara-722407.jpg?v=1676899365&width=990' },
    { key:'Luxury',   label: dir==='rtl'?'فاخرة':'Luxury',        img:'https://www.watchclub.com/upload/watches/gallery_big/watch-club-rolex-submariner-date-submarinerdate-ref-116610ln-year-2012-1754384403454-16116-6.jpg' },
    { key:'Sports',   label: dir==='rtl'?'رياضية':'Sports',       img:'https://img.drz.lazcdn.com/static/bd/p/884aebe054b0496a23e36080f61f5de6.jpg_960x960q80.jpg_.webp' },
    { key:'vintage', label: dir==='rtl'?'كلاسيكية':'Vintage', img:'https://i.redd.it/wts-oris-big-crown-complication-moonphase-40mm-bracelet-v0-8y82nynlsx2f1.jpg?width=2351&format=pjpg&auto=webp&s=fc145afed0404a05577712452ab6c6b98efa7969' },
  ]

  const s     = slides[currentSlide] || slides[0] || {}
  const title = dir==='rtl' ? s.title_ar    : s.title_en
  const sub   = dir==='rtl' ? s.subtitle_ar : s.subtitle_en
  const cta   = dir==='rtl' ? s.cta_ar      : s.cta_en

  return (
    <div dir={dir}>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"/>
        <div className="hero-grain"/>
        {slides.map((slide, i) => (
          <div key={slide.id} style={{ position:'absolute', inset:0, backgroundImage:`url(${slide.image_url})`, backgroundSize:'cover', backgroundPosition:'center', opacity: i===currentSlide ? 0.22 : 0, transition:'opacity 1.2s ease', filter:'grayscale(15%)' }}/>
        ))}
        <div className="container hero-content">
          {!slidesLoading && s.title_en && (
            <div key={currentSlide} style={{ animation:'fadeInUp 0.8s ease' }}>
              <div className="section-label" style={{ marginBottom:14 }}>✦ {dir==='rtl'?'ساعات فاخرة':'Luxury Timepieces'} ✦</div>
              <h1 className="hero-title">{title}</h1>
              <p className="hero-sub">{sub}</p>
              <div className="hero-btns">
                <button className="btn btn-gold" onClick={()=>navigate('/shop')}>{cta} <ArrowRight size={14}/></button>
                <button className="btn btn-outline" onClick={()=>navigate('/brands')}>{t.heroCtaSecondary}</button>
              </div>
            </div>
          )}
          {slides.length > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:32 }}>
              {slides.map((_, i) => (
                <button key={i} onClick={()=>setCurrentSlide(i)} style={{ height:2, width:i===currentSlide?32:14, background:i===currentSlide?'var(--gold)':'var(--text-muted)', border:'none', cursor:'pointer', transition:'all 0.3s ease', borderRadius:2 }}/>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding:'56px 0' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div className="section-label">{dir==='rtl'?'تصفح حسب النوع':'Browse by Style'}</div>
            <h2 className="section-title">{dir==='rtl'?'استكشف الفئات':'Explore Categories'}</h2>
          </div>
          <div className="category-grid">
            {categoryCards.map(cat => (
              <button key={cat.key} onClick={()=>navigate(`/shop?category=${cat.key}`)} className="category-card">
                <img src={cat.img} alt={cat.label} loading="lazy"/>
                <div className="category-overlay"/>
                <span className="category-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section style={{ padding:'0 0 56px' }}>
          <div className="container">
            <div className="section-header">
              <div><div className="section-label">{t.featured}</div><h2 className="section-title">{t.featuredTitle}</h2></div>
              <button className="btn btn-outline btn-small" onClick={()=>navigate('/shop')}>{dir==='rtl'?'عرض الكل':'View All'} <ArrowRight size={13}/></button>
            </div>
            <div className="product-grid">
              {featured.map((p,i)=><div key={p.id} className="animate-fadeInUp" style={{animationDelay:`${i*0.06}s`}}><ProductCard product={p}/></div>)}
            </div>
          </div>
        </section>
      )}

      {/* PROMO BANNER */}
      {/* <section style={{ margin:'0 0 56px' }}>
        <div className="container">
          <div className="promo-banner">
            <div className="promo-text">
              <div className="section-label" style={{ marginBottom:10 }}>{dir==='rtl'?'عرض حصري':'Exclusive Offer'}</div>
              <h2 className="promo-title">{dir==='rtl'?'مستعمل فاخر — معتمد وموثق':<>Pre-Owned Luxury<br/>Certified &amp; Authenticated</>}</h2>
              <p className="promo-desc">{dir==='rtl'?'كل ساعة مستعملة تخضع لفحص دقيق من 40 نقطة بواسطة صانعي ساعات معتمدين.':'Every pre-owned timepiece undergoes a rigorous 40-point inspection by certified master watchmakers.'}</p>
              <button className="btn btn-gold" style={{ alignSelf:'flex-start' }} onClick={()=>navigate('/shop')}>{dir==='rtl'?'تسوق المستعمل':'Shop Pre-Owned'} <ArrowRight size={13}/></button>
            </div>
            <div className="promo-img-wrap">
              <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80" alt="" loading="lazy"/>
              <div className="promo-img-overlay"/>
              <span className="tag tag-gold" style={{ position:'absolute', top:16, right:dir==='rtl'?'auto':16, left:dir==='rtl'?16:'auto' }}>{dir==='rtl'?'مستعمل معتمد':'Certified Pre-Owned'}</span>
            </div>
          </div>
        </div>
      </section> */}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section style={{ padding:'0 0 56px' }}>
          <div className="container">
            <div className="section-header">
              <div><div className="section-label">{t.new_arrivals}</div><h2 className="section-title">{t.newArrivalsTitle}</h2></div>
              <button className="btn btn-outline btn-small" onClick={()=>navigate('/shop?filter=new')}>{dir==='rtl'?'عرض الكل':'View All'} <ArrowRight size={13}/></button>
            </div>
            <div className="product-grid">{newArrivals.map(p=><ProductCard key={p.id} product={p}/>)}</div>
          </div>
        </section>
      )}

      {/* BRANDS */}
      {/* <section style={{ padding:'48px 0 56px', background:'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div className="section-label">{t.brandsTitle}</div>
            <h2 className="section-title">{dir==='rtl'?'شركاؤنا من الماركات':'Our Brand Partners'}</h2>
          </div>
          <div className="brands-grid">
            {['Rolex','Patek Philippe','Audemars Piguet','Cartier','Omega','IWC','Vacheron Constantin','A. Lange & Söhne','Hublot'].map(brand=>(
              <button key={brand} className="brand-pill" onClick={()=>navigate(`/shop?brand=${encodeURIComponent(brand)}`)}>{brand}</button>
            ))}
          </div>
        </div>
      </section> */}

    </div>
  )
}
