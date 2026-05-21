import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useNavigate } from 'react-router-dom'

export default function SearchOverlay() {
  const { t, dir, searchOpen, setSearchOpen, products } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (searchOpen) { setQ(''); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [searchOpen])

  useEffect(() => {
    const h = e => { if (e.key==='Escape') setSearchOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (!searchOpen) return null

  const results = q.length > 1
    ? products.filter(p =>
        p.name?.toLowerCase().includes(q.toLowerCase()) ||
        (p.brand_name||p.brand||'').toLowerCase().includes(q.toLowerCase())
      ).slice(0, 8)
    : []

  const go = (path) => { setSearchOpen(false); navigate(path) }

  return (
    <div className="search-overlay" onClick={e => { if(e.target===e.currentTarget) setSearchOpen(false) }}>
      <div style={{width:'100%',maxWidth:600,position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'14px 18px'}}>
          <Search size={18} style={{color:'var(--gold)',flexShrink:0}}/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'1.1rem',color:'var(--text-primary)',fontFamily:'var(--font-body)'}}
            dir={dir}/>
          <button onClick={()=>setSearchOpen(false)} style={{color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>
            <X size={18}/>
          </button>
        </div>

        {results.length>0&&(
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',marginTop:8,overflow:'hidden'}}>
            {results.map(p=>(
              <button key={p.id} onClick={()=>go(`/product/${p.id}`)}
                style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 16px',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid var(--border-subtle)',textAlign:'left'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <div style={{width:40,height:40,borderRadius:'var(--radius-sm)',overflow:'hidden',background:'var(--bg-secondary)',flexShrink:0}}>
                  <img src={p.images?.[0]||''} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{flex:1,minWidth:0,textAlign:dir==='rtl'?'right':'left'}}>
                  <div style={{fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)'}}>{p.brand_name||p.brand}</div>
                  <div style={{fontSize:'0.85rem',color:'var(--text-primary)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{p.name}</div>
                </div>
                <span style={{fontSize:'0.82rem',fontWeight:600,color:'var(--off-white)',flexShrink:0}}>${Number(p.price).toLocaleString()}</span>
              </button>
            ))}
            <button onClick={()=>go(`/shop?q=${encodeURIComponent(q)}`)}
              style={{display:'block',width:'100%',padding:'12px',fontSize:'0.75rem',color:'var(--gold)',background:'none',border:'none',cursor:'pointer',textAlign:'center',letterSpacing:'0.08em'}}>
              View all results for "{q}"
            </button>
          </div>
        )}

        {q.length>1&&results.length===0&&(
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',marginTop:8,padding:'24px',textAlign:'center',color:'var(--text-muted)',fontSize:'0.85rem'}}>
            {t.noResults}
          </div>
        )}
      </div>
    </div>
  )
}
