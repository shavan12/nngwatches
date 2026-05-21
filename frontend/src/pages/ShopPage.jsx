import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

export default function ShopPage() {
  const { t, dir, products, productsLoading, loadProducts, brands, categories } = useStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const params    = new URLSearchParams(location.search)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    brand:    params.get('brand')    || '',
    category: params.get('category') || '',
    sort:     params.get('sort')     || '',
    q:        params.get('q')        || '',
    in_stock: '',
  })

  useEffect(() => {
    const p = {}
    if (filters.brand)    p.brand    = filters.brand
    if (filters.category) p.category = filters.category
    if (filters.sort)     p.sort     = filters.sort
    if (filters.q)        p.q        = filters.q
    if (filters.in_stock) p.in_stock = filters.in_stock
    loadProducts(p)
  }, [filters])

  const set = (k, v) => setFilters(f => ({...f, [k]:v}))
  const clear = () => setFilters({brand:'',category:'',sort:'',q:'',in_stock:''})
  const activeCount = [filters.brand,filters.category,filters.sort,filters.in_stock].filter(Boolean).length

  const inp = { width:'100%',padding:'10px 12px',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:'14px',outline:'none',fontFamily:'var(--font-body)' }

  const FilterPanel = () => (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div>
        <div style={{fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Sort By</div>
        <select style={inp} value={filters.sort} onChange={e=>set('sort',e.target.value)}>
          <option value="">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
      <div>
        <div style={{fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Brand</div>
        <select style={inp} value={filters.brand} onChange={e=>set('brand',e.target.value)}>
          <option value="">All Brands</option>
          {brands.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <div style={{fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Category</div>
        <select style={inp} value={filters.category} onChange={e=>set('category',e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c=><option key={c.id} value={c.slug}>{c.name_en}</option>)}
        </select>
      </div>
      <div>
        <div style={{fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Availability</div>
        <select style={inp} value={filters.in_stock} onChange={e=>set('in_stock',e.target.value)}>
          <option value="">All</option>
          <option value="1">In Stock</option>
          <option value="0">Sold Out</option>
        </select>
      </div>
      {activeCount>0&&(
        <button className="btn btn-outline" style={{padding:'10px',fontSize:'0.7rem'}} onClick={clear}>
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <div dir={dir} style={{padding:'32px 0 80px'}}>
      <div className="container">
        {/* Header */}
        <div style={{marginBottom:28}}>
          <div className="section-label">Collection</div>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.6rem,4vw,2.4rem)',fontWeight:300,color:'var(--off-white)'}}>
              {filters.brand||filters.category||'All Watches'}
            </h1>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{products.length} {t.results}</span>
              <button className="btn btn-outline btn-small" style={{display:'flex',alignItems:'center',gap:6}} onClick={()=>setFilterOpen(true)}>
                <SlidersHorizontal size={13}/> Filters {activeCount>0&&`(${activeCount})`}
              </button>
            </div>
          </div>
          {/* Active filter pills */}
          {activeCount>0&&(
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
              {[['brand',filters.brand],['category',filters.category],['sort',filters.sort],['in_stock',filters.in_stock==='1'?'In Stock':filters.in_stock==='0'?'Sold Out':'']].filter(([,v])=>v).map(([k,v])=>(
                <span key={k} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',background:'var(--gold-muted)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,fontSize:'0.68rem',color:'var(--gold)'}}>
                  {v}
                  <button onClick={()=>set(k,'')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--gold)',display:'flex',alignItems:'center'}}><X size={11}/></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Desktop layout */}
        <div style={{display:'flex',gap:32}}>
          {/* Desktop filter sidebar */}
          <div className="filter-panel">
            <FilterPanel/>
          </div>

          {/* Grid */}
          <div style={{flex:1,minWidth:0}}>
            {productsLoading ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16}}>
                {[...Array(8)].map((_,i)=>(
                  <div key={i} style={{borderRadius:'var(--radius-md)',overflow:'hidden'}}>
                    <div className="skeleton" style={{aspectRatio:'1'}}/>
                    <div style={{padding:'12px',display:'flex',flexDirection:'column',gap:8}}>
                      <div className="skeleton" style={{height:10,borderRadius:4,width:'40%'}}/>
                      <div className="skeleton" style={{height:14,borderRadius:4}}/>
                      <div className="skeleton" style={{height:12,borderRadius:4,width:'30%'}}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length===0 ? (
              <div style={{textAlign:'center',padding:'80px 20px',color:'var(--text-muted)'}}>
                <p style={{fontSize:'1rem',marginBottom:16}}>{t.noResults}</p>
                <button className="btn btn-outline" onClick={clear}>Clear Filters</button>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((p,i)=>(
                  <div key={p.id} className="animate-fadeInUp" style={{animationDelay:`${i*0.04}s`}}>
                    <ProductCard product={p}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:800}} onClick={()=>setFilterOpen(false)}/>
          <div className="filter-panel-mobile">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <span style={{fontFamily:'var(--font-display)',fontSize:'1.2rem',fontWeight:300}}>Filters</span>
              <button onClick={()=>setFilterOpen(false)} style={{width:34,height:34,borderRadius:'50%',background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-secondary)'}}>
                <X size={15}/>
              </button>
            </div>
            <FilterPanel/>
            <button className="btn btn-gold" style={{width:'100%',marginTop:24,padding:'14px'}} onClick={()=>setFilterOpen(false)}>
              Show {products.length} Results
            </button>
          </div>
        </>
      )}
    </div>
  )
}
