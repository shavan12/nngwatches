import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

// ── CSS injected once ─────────────────────────────────────
const CSS = `
@keyframes imgModalIn  { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
@keyframes imgModalOut { from { opacity:1; transform:scale(1);    } to { opacity:0; transform:scale(0.92); } }
@keyframes imgBgIn     { from { opacity:0; } to { opacity:1; } }
@keyframes thumbSlide  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.img-modal-bg {
  position:fixed; inset:0; z-index:2000;
  background:rgba(0,0,0,0.96);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  animation:imgBgIn 0.25s ease;
  display:flex; flex-direction:column;
}
.img-modal-inner {
  animation:imgModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.img-modal-inner.closing {
  animation:imgModalOut 0.2s ease forwards;
}
.img-thumb-btn {
  transition:all 0.2s ease;
  cursor:pointer;
  border:none;
  padding:0;
  background:none;
}
.img-thumb-btn:hover { opacity:1 !important; transform:scale(1.05); }
.img-nav-btn {
  transition:all 0.2s ease;
  border:none;
  cursor:pointer;
}
.img-nav-btn:hover { background:rgba(255,255,255,0.15) !important; transform:scale(1.05); }
.img-nav-btn:active { transform:scale(0.96); }
.img-close-btn { transition:all 0.2s ease; border:none; cursor:pointer; }
.img-close-btn:hover { background:rgba(255,255,255,0.15) !important; transform:rotate(90deg); }
.img-zoom-btn { transition:all 0.15s ease; border:none; cursor:pointer; }
.img-zoom-btn:hover { background:rgba(255,255,255,0.15) !important; }
.img-main-wrap { cursor:zoom-in; overflow:hidden; }
.img-main-wrap.zoomed { cursor:zoom-out; }
.img-main-img {
  transition:transform 0.4s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease;
  user-select:none;
  -webkit-user-drag:none;
}
.img-main-img.switching { opacity:0; transform:scale(0.97) !important; }
`

let cssInjected = false
function injectCSS() {
  if (cssInjected) return
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)
  cssInjected = true
}

export default function ImageModal({ images = [], startIndex = 0, onClose }) {
  injectCSS()

  const [idx,       setIdx]     = useState(startIndex)
  const [zoomed,    setZoomed]  = useState(false)
  const [switching, setSwitching] = useState(false)
  const [closing,   setClosing] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const imgs = images.length ? images : ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&q=90']

  // ── Navigation ────────────────────────────────────────
  const goTo = useCallback((newIdx) => {
    if (newIdx === idx || switching) return
    setSwitching(true)
    setTimeout(() => {
      setIdx(newIdx)
      setZoomed(false)
      setSwitching(false)
    }, 180)
  }, [idx, switching])

  const prev = useCallback(() => goTo((idx - 1 + imgs.length) % imgs.length), [idx, imgs.length, goTo])
  const next = useCallback(() => goTo((idx + 1) % imgs.length), [idx, imgs.length, goTo])

  // ── Close with animation ──────────────────────────────
  const close = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 180)
  }, [onClose])

  // ── Keyboard ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')      close()
      if (e.key === 'ArrowLeft')   prev()
      if (e.key === 'ArrowRight')  next()
      if (e.key === 'z' || e.key === 'Z') setZoomed(z => !z)
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [close, prev, next])

  // ── Touch / swipe ─────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
    if (Math.abs(dx) > 50 && dy < 80) {
      dx > 0 ? next() : prev()
    }
    touchStartX.current = null
  }

  const isMobile = window.innerWidth < 768

  return (
    <div className="img-modal-bg" onClick={close} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', flexShrink:0 }} onClick={e => e.stopPropagation()}>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', fontWeight:400, letterSpacing:'0.04em' }}>
          {imgs.length > 1 && `${idx + 1} / ${imgs.length}`}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Zoom toggle — desktop only */}
          {!isMobile && (
            <button className="img-zoom-btn" onClick={e => { e.stopPropagation(); setZoomed(z => !z) }}
              style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {zoomed ? <ZoomOut size={16}/> : <ZoomIn size={16}/>}
            </button>
          )}
          {/* Close */}
          <button className="img-close-btn" onClick={e => { e.stopPropagation(); close() }}
            style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.08)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* ── Main image area ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding: isMobile ? '0' : '0 60px' }}
        onClick={e => e.stopPropagation()}>

        {/* Left arrow */}
        {imgs.length > 1 && (
          <button className="img-nav-btn" onClick={prev}
            style={{ position:'absolute', left: isMobile ? 8 : 12, top:'50%', transform:'translateY(-50%)', zIndex:10, width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronLeft size={isMobile ? 20 : 24}/>
          </button>
        )}

        {/* Image */}
        <div className={`img-modal-inner${closing ? ' closing' : ''}`}
          style={{ maxWidth: isMobile ? '100vw' : 'min(80vw,860px)', maxHeight:'calc(100vh - 200px)', width:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className={`img-main-wrap${zoomed ? ' zoomed' : ''}`}
            onClick={() => !isMobile && setZoomed(z => !z)}
            style={{ width: isMobile ? '100vw' : 'auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img
              src={imgs[idx]}
              alt=""
              className={`img-main-img${switching ? ' switching' : ''}`}
              style={{
                maxWidth: isMobile ? '100vw' : 'min(80vw,860px)',
                maxHeight:'calc(100vh - 200px)',
                width:'auto', height:'auto',
                objectFit:'contain',
                transform: zoomed ? 'scale(1.85)' : 'scale(1)',
                borderRadius: isMobile ? 0 : '12px',
                display:'block',
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Right arrow */}
        {imgs.length > 1 && (
          <button className="img-nav-btn" onClick={next}
            style={{ position:'absolute', right: isMobile ? 8 : 12, top:'50%', transform:'translateY(-50%)', zIndex:10, width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronRight size={isMobile ? 20 : 24}/>
          </button>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {imgs.length > 1 && (
        <div style={{ flexShrink:0, padding:'14px 16px 20px', display:'flex', justifyContent:'center', gap:8, overflowX:'auto', scrollbarWidth:'none' }}
          onClick={e => e.stopPropagation()}>
          {imgs.map((img, i) => (
            <button key={i} className="img-thumb-btn" onClick={() => goTo(i)}
              style={{ width: isMobile ? 52 : 62, height: isMobile ? 52 : 62, flexShrink:0, borderRadius:8, overflow:'hidden', border:`2px solid ${i===idx ? '#c9a84c' : 'rgba(255,255,255,0.15)'}`, opacity: i===idx ? 1 : 0.55, animation:`thumbSlide 0.3s ease ${i*0.04}s both` }}>
              <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hint — desktop */}
      {!isMobile && (
        <div style={{ textAlign:'center', paddingBottom:12, fontSize:'11px', color:'rgba(255,255,255,0.2)', letterSpacing:'0.06em', flexShrink:0 }}>
          ← → navigate &nbsp;·&nbsp; Z zoom &nbsp;·&nbsp; ESC close
        </div>
      )}
    </div>
  )
}
