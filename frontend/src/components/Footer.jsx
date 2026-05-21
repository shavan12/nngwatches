import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export function WhatsAppButton() {
  const { openWhatsApp } = useStore()
  return (
    <button className="whatsapp-btn" onClick={() => openWhatsApp(null)} aria-label="WhatsApp">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </button>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type==='success' ? '✓' : '!'} {t.msg}
        </div>
      ))}
    </div>
  )
}

export function Footer() {
  const navigate  = useNavigate()
  const { t, dir } = useStore()
  return (
    <footer dir={dir} style={{ background:'var(--bg-secondary)', borderTop:'1px solid var(--border-subtle)', padding:'48px 0 24px', marginTop:40 }}>
      <div className="container">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:32, marginBottom:40 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.2em', marginBottom:10 }}>NNG</div>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.8 }}>Premium luxury timepieces curated for the discerning collector.</p>
          </div>
          <div>
            <div style={{ fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:14 }}>Shop</div>
            {[['All Watches','/shop'],['New Arrivals','/shop?filter=new'],['Brands','/brands']].map(([label,path])=>(
              <button key={label} onClick={()=>navigate(path)} style={{ display:'block', fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:8, background:'none', border:'none', cursor:'pointer', textAlign:dir==='rtl'?'right':'left', padding:0 }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>{label}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:14 }}>Info</div>
            {[['Contact','/contact']].map(([label,path])=>(
              <button key={label} onClick={()=>navigate(path)} style={{ display:'block', fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:8, background:'none', border:'none', cursor:'pointer', textAlign:dir==='rtl'?'right':'left', padding:0 }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--gold)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>© {new Date().getFullYear()} NNG Luxury Timepieces</span>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>All rights reserved</span>
        </div>
      </div>
    </footer>
  )
}
