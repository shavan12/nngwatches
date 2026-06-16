import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, Heart, Search, Menu, X, Globe, User, LogOut, Shield } from 'lucide-react'
import { useStore } from '../context/StoreContext'

export default function Header() {
  const { t, lang, setLang, dir, cartCount, setCartOpen, setSearchOpen, user, isAdmin, logout, setAuthOpen, wishlist } = useStore()
  const [scrolled, setScrolled]         = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen]  = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileMenuOpen(false); setUserMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!userMenuOpen) return
    const close = () => setUserMenuOpen(false)
    setTimeout(() => document.addEventListener('click', close), 0)
    return () => document.removeEventListener('click', close)
  }, [userMenuOpen])

  const navLinks = [
    { label: t.home,    path: '/' },
    { label: t.shop,    path: '/shop' },
    { label: t.brands,  path: '/brands' },
    // { label: t.about,   path: '/about' },
    { label: t.contact, path: '/contact' },
  ]

  const iconBtn = { padding: 8, borderRadius: '50%' }

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`} dir={dir}>

        {/* ── Top bar ── */}
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '6px 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
              {/* ✦ FREE SHIPPING ON ORDERS OVER $5,000 ✦ */}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Language toggle */}
              <button className="btn-ghost" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
                <Globe size={12} />
                {lang === 'en' ? 'العربية' : 'English'}
              </button>

              {/* Auth */}
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button className="btn-ghost" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v) }}>
                    <User size={12} />
                    {user.name.split(' ')[0]}
                  </button>

                  {userMenuOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', [dir === 'rtl' ? 'left' : 'right']: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', minWidth: 160, overflow: 'hidden', boxShadow: 'var(--shadow-card)', animation: 'slideDown 0.2s ease', zIndex: 800 }}>
                      {isAdmin && (
                        <button onClick={() => navigate('/admin')}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', fontSize: '0.75rem', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Shield size={13} /> {t.admin}
                        </button>
                      )}
                      <button onClick={() => { logout(); setUserMenuOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <LogOut size={13} /> {t.signOut}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="btn-ghost" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setAuthOpen(true)}>
                  <User size={12} /> {t.signIn}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Main nav ── */}
        <div style={{ padding: '18px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>

            {/* Logo */}
            <button onClick={() => navigate('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: dir === 'rtl' ? 'flex-end' : 'flex-start', gap: 2, flexShrink: 0 }}>
              <img src="/NGF.webp" alt="NG" style={{height: 40,width: 'auto',objectFit: 'contain',cursor: 'pointer',}}onClick={() => navigate('/')}
/>
            </button>

            {/* Desktop links */}
            <nav className="hide-mobile" style={{ display: 'flex', gap: 32 }}>
              {navLinks.map(l => (
                <button key={l.path} className={`nav-link ${location.pathname === l.path ? 'active' : ''}`} onClick={() => navigate(l.path)}>
                  {l.label}
                </button>
              ))}
            </nav>

            {/* Icon row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className="btn-ghost" style={iconBtn} onClick={() => setSearchOpen(true)}><Search size={18} /></button>

              <button className="btn-ghost" style={{ ...iconBtn, position: 'relative' }} onClick={() => navigate('/wishlist')}>
                <Heart size={18} />
                {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
              </button>

              <button className="btn-ghost" style={{ ...iconBtn, position: 'relative' }} onClick={() => setCartOpen(true)}>
                <ShoppingBag size={18} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </button>

              <button className="btn-ghost show-mobile" style={iconBtn} onClick={() => setMobileMenuOpen(v => !v)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileMenuOpen && (
          <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', animation: 'slideDown 0.25s ease' }}>
            {navLinks.map(l => (
              <button key={l.path} onClick={() => navigate(l.path)} style={{ display: 'block', width: '100%', padding: '13px 0', textAlign: dir === 'rtl' ? 'right' : 'left', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: location.pathname === l.path ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border-subtle)', cursor: 'pointer' }}>
                {l.label}
              </button>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '10px', fontSize: '0.7rem', minWidth: 80 }}
                onClick={() => { setLang(lang === 'en' ? 'ar' : 'en'); setMobileMenuOpen(false) }}>
                <Globe size={13} /> {lang === 'en' ? 'عربي' : 'EN'}
              </button>
              {user ? (
                <>
                  {isAdmin && (
                    <button className="btn btn-outline" style={{ flex: 1, padding: '10px', fontSize: '0.7rem', minWidth: 80, color: 'var(--gold)', borderColor: 'var(--gold)' }}
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false) }}>
                      <Shield size={13} /> {t.admin}
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ flex: 1, padding: '10px', fontSize: '0.7rem', minWidth: 80 }}
                    onClick={() => { logout(); setMobileMenuOpen(false) }}>
                    <LogOut size={13} /> {t.signOut}
                  </button>
                </>
              ) : (
                <button className="btn btn-gold" style={{ flex: 1, padding: '10px', fontSize: '0.7rem', minWidth: 80 }}
                  onClick={() => { setAuthOpen(true); setMobileMenuOpen(false) }}>
                  <User size={13} /> {t.signIn}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div style={{ height: 104 }} />
    </>
  )
}
