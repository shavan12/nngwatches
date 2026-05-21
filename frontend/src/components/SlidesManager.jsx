// ─────────────────────────────────────────────────────────
//  SlidesManager.jsx
//  Place in: frontend/src/components/SlidesManager.jsx
//  Used inside AdminPage for the "Hero Slides" section
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, GripVertical, Image } from 'lucide-react'
import { useStore } from '../context/StoreContext'

const inp = { width:'100%', padding:'10px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', fontSize:'14px', outline:'none', fontFamily:'var(--font-body)' }
const lbl = { display:'block', fontSize:'0.6rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:5 }

function SlideForm({ slide, onSave, onCancel, uploadImage }) {
  const isEdit = !!slide
  const [form, setForm] = useState(slide ? { ...slide } : {
    title_en:'', title_ar:'', subtitle_en:'', subtitle_ar:'',
    cta_en:'Shop Now', cta_ar:'تسوق الآن',
    image_url:'', active:true, sort_order:0,
  })
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleUpload = async e => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadImage(file); set('image_url', url) }
    catch (err) { setError('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  const handleSubmit = async () => {
    if (!form.image_url) { setError('Image URL is required'); return }
    setSaving(true); setError('')
    try { await onSave(form) }
    catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:20, marginBottom:16 }}>
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:400, color:'var(--off-white)', marginBottom:16 }}>
        {isEdit ? 'Edit Slide' : 'Add New Slide'}
      </h3>

      {error && <div style={{ padding:'9px 12px', background:'rgba(224,68,68,0.08)', border:'1px solid rgba(224,68,68,0.25)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'#e04444', marginBottom:12 }}>{error}</div>}

      {/* Image */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl}>Slide Image *</label>
        {form.image_url && (
          <div style={{ position:'relative', aspectRatio:'16/6', borderRadius:'var(--radius-sm)', overflow:'hidden', marginBottom:8, background:'var(--bg-secondary)' }}>
            <img src={form.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <input style={{ ...inp, flex:1 }} value={form.image_url} onChange={e=>set('image_url',e.target.value)} placeholder="https://images.unsplash.com/..."/>
          <label style={{ padding:'10px 14px', background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
            {uploading ? '...' : <><Image size={14}/> Upload</>}
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display:'none' }}/>
          </label>
        </div>
      </div>

      {/* Titles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <div>
          <label style={lbl}>Title (English)</label>
          <input style={inp} value={form.title_en} onChange={e=>set('title_en',e.target.value)} placeholder="Timeless Elegance"/>
        </div>
        <div>
          <label style={lbl}>Title (Arabic)</label>
          <input style={{ ...inp, direction:'rtl' }} value={form.title_ar} onChange={e=>set('title_ar',e.target.value)} placeholder="أناقة خالدة"/>
        </div>
      </div>

      {/* Subtitles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <div>
          <label style={lbl}>Subtitle (English)</label>
          <textarea style={{ ...inp, resize:'vertical', minHeight:70 }} value={form.subtitle_en} onChange={e=>set('subtitle_en',e.target.value)} placeholder="Discover the world's finest..."/>
        </div>
        <div>
          <label style={lbl}>Subtitle (Arabic)</label>
          <textarea style={{ ...inp, resize:'vertical', minHeight:70, direction:'rtl' }} value={form.subtitle_ar} onChange={e=>set('subtitle_ar',e.target.value)} placeholder="اكتشف أرقى الساعات..."/>
        </div>
      </div>

      {/* CTA + sort */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:10, marginBottom:16 }}>
        <div>
          <label style={lbl}>Button Text (EN)</label>
          <input style={inp} value={form.cta_en} onChange={e=>set('cta_en',e.target.value)} placeholder="Shop Now"/>
        </div>
        <div>
          <label style={lbl}>Button Text (AR)</label>
          <input style={{ ...inp, direction:'rtl' }} value={form.cta_ar} onChange={e=>set('cta_ar',e.target.value)} placeholder="تسوق الآن"/>
        </div>
        <div>
          <label style={lbl}>Order</label>
          <input style={inp} type="number" min="0" value={form.sort_order} onChange={e=>set('sort_order',Number(e.target.value))}/>
        </div>
      </div>

      {/* Active toggle */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button type="button" onClick={()=>set('active',!form.active)} style={{
          width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
          background: form.active ? 'var(--gold)' : 'var(--bg-card)',
          position:'relative', transition:'background 0.2s',
        }}>
          <div style={{ position:'absolute', top:3, left: form.active?22:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s' }}/>
        </button>
        <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>
          {form.active ? 'Visible on homepage' : 'Hidden (draft)'}
        </span>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-gold" style={{ flex:1, padding:'11px' }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : <><Check size={14}/> {isEdit ? 'Update Slide' : 'Add Slide'}</>}
        </button>
        <button className="btn btn-outline" style={{ flex:1, padding:'11px' }} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function SlidesManager() {
  const { api, uploadImage } = useStore()
  const [slides,  setSlides]  = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // null | 'new' | slide object
  const [error,   setError]   = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api('/slides/all')
      setSlides(res.data || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    if (editing === 'new') {
      await api('/slides', { method:'POST', body: JSON.stringify(form) })
    } else {
      await api(`/slides/${editing.id}`, { method:'PUT', body: JSON.stringify(form) })
    }
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return
    await api(`/slides/${id}`, { method:'DELETE' })
    load()
  }

  const toggleActive = async (slide) => {
    await api(`/slides/${slide.id}`, { method:'PUT', body: JSON.stringify({ active: slide.active ? 0 : 1 }) })
    load()
  }

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading slides...</div>

  return (
    <div style={{ animation:'fadeInUp 0.4s ease' }}>
      {error && <div style={{ padding:'10px 14px', background:'rgba(224,68,68,0.08)', border:'1px solid rgba(224,68,68,0.25)', borderRadius:'var(--radius-sm)', fontSize:'0.8rem', color:'#e04444', marginBottom:16 }}>{error}</div>}

      {/* Add new form */}
      {editing === 'new' && (
        <SlideForm onSave={handleSave} onCancel={()=>setEditing(null)} uploadImage={uploadImage}/>
      )}
      {editing && editing !== 'new' && (
        <SlideForm slide={editing} onSave={handleSave} onCancel={()=>setEditing(null)} uploadImage={uploadImage}/>
      )}

      {/* Add button */}
      {!editing && (
        <button className="btn btn-gold" style={{ marginBottom:16, padding:'11px 20px', fontSize:'0.7rem' }} onClick={()=>setEditing('new')}>
          <Plus size={14}/> Add New Slide
        </button>
      )}

      {/* Slides list */}
      {slides.length === 0 && !editing && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)', fontSize:'0.85rem', background:'var(--bg-card)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)' }}>
          No slides yet. Add your first hero slide above.
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {slides.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(slide => (
          <div key={slide.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', overflow:'hidden', opacity: slide.active ? 1 : 0.55, transition:'opacity 0.2s' }}>
            {/* Preview image */}
            <div style={{ position:'relative', aspectRatio:'16/5', overflow:'hidden', background:'var(--bg-secondary)' }}>
              <img src={slide.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
              {/* Text overlay preview */}
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'16px 20px' }}>
                <div style={{ fontSize:'0.6rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', marginBottom:4 }}>✦ NNG ✦</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(0.9rem,2.5vw,1.4rem)', color:'white', fontWeight:300, marginBottom:4 }}>{slide.title_en || 'No title'}</div>
                <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', maxWidth:400 }}>{slide.subtitle_en}</div>
              </div>
              {/* Status badge */}
              <div style={{ position:'absolute', top:10, right:10, padding:'3px 10px', borderRadius:20, fontSize:'0.6rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', background: slide.active ? 'rgba(76,201,168,0.15)' : 'rgba(90,86,82,0.5)', color: slide.active ? '#4cc9a8' : 'var(--text-muted)', border: `1px solid ${slide.active?'rgba(76,201,168,0.3)':'rgba(90,86,82,0.3)'}` }}>
                {slide.active ? 'Live' : 'Hidden'}
              </div>
              {/* Sort order badge */}
              <div style={{ position:'absolute', top:10, left:10, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', color:'var(--text-secondary)', fontWeight:600 }}>
                {slide.sort_order || 0}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{slide.title_en || 'Untitled'}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Order: {slide.sort_order||0} · {slide.cta_en}</div>
              </div>
              {/* Toggle active */}
              <button onClick={()=>toggleActive(slide)} title={slide.active?'Hide slide':'Show slide'}
                style={{ width:34, height:34, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-elevated)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: slide.active ? '#4cc9a8' : 'var(--text-muted)' }}>
                {slide.active ? <Eye size={14}/> : <EyeOff size={14}/>}
              </button>
              {/* Edit */}
              <button onClick={()=>setEditing(slide)}
                style={{ width:34, height:34, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', background:'var(--bg-elevated)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
                <Edit2 size={14}/>
              </button>
              {/* Delete */}
              <button onClick={()=>handleDelete(slide.id)}
                style={{ width:34, height:34, borderRadius:'var(--radius-sm)', border:'1px solid rgba(224,68,68,0.3)', background:'rgba(224,68,68,0.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#e04444' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', fontSize:'0.75rem', color:'var(--text-muted)' }}>
        💡 Tips: Use "Order" number to control which slide appears first (0 = first). Toggle the eye icon to show/hide a slide without deleting it. Changes appear on the homepage immediately.
      </div>
    </div>
  )
}
