import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './context/StoreContext'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer'
import SearchOverlay from './components/SearchOverlay'
import AuthModal from './components/AuthModal'
import { WhatsAppButton, Toasts, Footer } from './components/Footer'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminPage from './pages/AdminPage'
import AuctionsPage from './pages/AuctionsPage'
import AuctionDetailPage from './pages/AuctionDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import { WishlistPage, BrandsPage } from './pages/OtherPages'
import ProfilePage from './pages/ProfilePage'
import AuctionCheckoutPage from './pages/AuctionCheckoutPage'

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0,0) }, [pathname])
  return null
}

// Apply dir to document
function DirSync() {
  const { dir } = useStore()
  useEffect(() => {
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en')
  }, [dir])
  return null
}

// Layout wrapper for public pages
function PublicLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

function AppRoutes() {
  return (
    <>
      <DirSync />
      <ScrollToTop />
      <CartDrawer />
      <SearchOverlay />
      <AuthModal />
      <WhatsAppButton />
      <Toasts />

      <Routes>
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/shop" element={<PublicLayout><ShopPage /></PublicLayout>} />
        <Route path="/product/:id" element={<PublicLayout><ProductPage /></PublicLayout>} />
        <Route path="/brands" element={<PublicLayout><BrandsPage /></PublicLayout>} />
        <Route path="/wishlist" element={<PublicLayout><WishlistPage /></PublicLayout>} />
        <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
        <Route path="/auctions" element={<PublicLayout><AuctionsPage /></PublicLayout>} />
        <Route path="/auction/:id" element={<PublicLayout><AuctionDetailPage /></PublicLayout>} />
        <Route path="/auction/:id/checkout" element={<PublicLayout><AuctionCheckoutPage /></PublicLayout>} />
        <Route path="/notifications" element={<PublicLayout><NotificationsPage /></PublicLayout>} />
        <Route path="/profile" element={<PublicLayout><ProfilePage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout>
          <div style={{ padding:'80px 20px', textAlign:'center', maxWidth:640, margin:'0 auto' }}>
            <div className="section-label">Our Story</div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2.5rem', fontWeight:300, marginBottom:16 }}>About NNG</h1>
            <p style={{ color:'var(--text-secondary)', lineHeight:1.9 }}>NGG is a premier destination for luxury timepieces, founded in 2015 with a passion for horological excellence. We curate only the finest watches from the world's most prestigious manufacturers.</p>
          </div>
        </PublicLayout>} />
        <Route path="/contact" element={<PublicLayout>
          <div style={{ padding:'80px 20px', textAlign:'center', maxWidth:480, margin:'0 auto' }}>
            <div className="section-label">Get In Touch</div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2.5rem', fontWeight:300, marginBottom:16 }}>Contact Us</h1>
            <p style={{ color:'var(--text-secondary)', marginBottom:32 }}>Our expert team is available to assist you in finding your perfect timepiece.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Email */}
              <a href="mailto:Nawfel.nabil1992@gmail.com" className="btn btn-outline" style={{ textAlign:'center', justifyContent:'center', display:'flex', alignItems:'center', gap:10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                Nawfel.nabil1992@gmail.com
              </a>

              {/* WhatsApp */}
              <a href="https://wa.me/+9647504437579" className="btn btn-gold" target="_blank" rel="noreferrer" style={{ textAlign:'center', justifyContent:'center', display:'flex', alignItems:'center', gap:10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp Chat
              </a>

              {/* Instagram */}
              <a href="https://www.instagram.com/nawfel_nabil?igsh=NWYzY2NqbHB3aWM3&utm_source=qr" target="_blank" rel="noreferrer"
                style={{ textAlign:'center', justifyContent:'center', display:'flex', alignItems:'center', gap:10, padding:'13px 26px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none', transition:'var(--transition)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#e1306c';e.currentTarget.style.color='#e1306c'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.color='var(--text-secondary)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                Instagram
              </a>

              {/* TikTok */}
              <a href="https://www.tiktok.com/@nawfelnabil?_r=1&_t=ZS-94pZ2UE81PY" target="_blank" rel="noreferrer"
                style={{ textAlign:'center', justifyContent:'center', display:'flex', alignItems:'center', gap:10, padding:'13px 26px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none', transition:'var(--transition)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#ffffff';e.currentTarget.style.color='#ffffff'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.color='var(--text-secondary)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                TikTok
              </a>

              {/* Facebook */}
              <a href="https://www.facebook.com/share/1BK8JhqUQ7/?mibextid=wwXIfr" target="_blank" rel="noreferrer"
                style={{ textAlign:'center', justifyContent:'center', display:'flex', alignItems:'center', gap:10, padding:'13px 26px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none', transition:'var(--transition)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#1877f2';e.currentTarget.style.color='#1877f2'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-subtle)';e.currentTarget.style.color='var(--text-secondary)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>

            </div>
          </div>
        </PublicLayout>} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  )
}
