import React, { useState } from 'react'
import { X, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useStore } from '../context/StoreContext'

export default function AuthModal() {
  const { t, dir, authOpen, setAuthOpen, login, register, addToast } = useStore()
  const [mode, setMode]       = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [form, setForm]       = useState({ name:'', email:'', password:'', phone:'' })
  const [error, setError]     = useState('')

  if (!authOpen) return null
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password)
        addToast(`Welcome back, ${user.name}!`)
      } else {
        const user = await register(form.name, form.email, form.password, form.phone)
        addToast(`Account created! Welcome, ${user.name}!`)
      }
      setAuthOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAuthOpen(false) }}>
      <div className="modal-box" style={{ maxWidth: 420 }} dir={dir}>
        {/* Header */}
        <div style={{ padding:'24px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:300, color:'var(--off-white)', marginBottom:4 }}>
              {mode === 'login' ? t.loginTitle : t.registerTitle}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
              {mode === 'login' ? t.loginSubtitle : ''}
            </div>
          </div>
          <button className="btn-ghost" style={{ padding:8, borderRadius:'50%', background:'var(--bg-elevated)', marginTop:-4, flexShrink:0 }} onClick={() => setAuthOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 24px 24px', display:'grid', gap:14 }}>
          {mode === 'register' && (
            <div>
              <label style={{ display:'block', fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t.registerName}</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ahmed Al-Rashid" required />
            </div>
          )}

          <div>
            <label style={{ display:'block', fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t.loginEmail}</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display:'block', fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t.phone}</label>
              <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+971 50 123 4567" />
            </div>
          )}

          <div>
            <label style={{ display:'block', fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{t.loginPassword}</label>
            <div style={{ position:'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••" required minLength={6}
                style={{ paddingRight: 44 }}
              />
              <button type="button" className="btn-ghost" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', padding:4, color:'var(--text-muted)' }} onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding:'10px 14px', background:'rgba(224,68,68,0.08)', border:'1px solid rgba(224,68,68,0.25)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'#e04444' }}>
              {error}
            </div>
          )}

          <button className="btn btn-gold" style={{ padding:'13px', marginTop:4 }} disabled={loading}>
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:14, height:14, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'var(--bg-primary)', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block' }} />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <>
                {mode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
                {mode === 'login' ? t.loginBtn : t.register}
              </>
            )}
          </button>

          <div style={{ textAlign:'center', fontSize:'0.78rem', color:'var(--text-muted)' }}>
            {mode === 'login' ? t.noAccount : 'Already have an account?'}{' '}
            <button type="button" style={{ color:'var(--gold)', fontWeight:500, background:'none', border:'none', cursor:'pointer' }}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
              {mode === 'login' ? t.register : t.signIn}
            </button>
          </div>

          {/* Demo hint */}
          {mode === 'login' && (
            <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center' }}>
              Admin login: <strong style={{ color:'var(--gold)' }}>admin@ngg.com</strong> / <strong style={{ color:'var(--gold)' }}>admin123</strong>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
