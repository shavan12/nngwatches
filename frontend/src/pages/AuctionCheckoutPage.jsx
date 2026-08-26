import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Trophy, MapPin, Truck, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuctionCheckoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, dir, user, api, addToast } = useStore()
  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    shipping_address: '',
    city: '',
    country: '',
    notes: '',
  })

  useEffect(() => {
    if (user) {
      loadAuction()
      loadProfile()
    }
  }, [user, id])

  const loadAuction = async () => {
    try {
      const data = await api(`/auctions/${id}`)
      setAuction(data)
    } catch {
      addToast(t.error, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      const data = await api('/auth/me')
      setProfile(data)
      if (data.location) {
        const parts = data.location.split(',').map(s => s.trim())
        setForm(prev => ({
          ...prev,
          shipping_address: data.location,
          city: parts[0] || '',
          country: parts[1] || parts[0] || '',
        }))
      }
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.shipping_address || !form.city || !form.country) {
      addToast(t.errFieldsRequired || 'Please fill all required fields', 'error')
      return
    }
    setSubmitting(true)
    try {
      const data = await api(`/auctions/${id}/winner-order`, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setSuccess(data)
      addToast(t.orderCreated)
    } catch (err) {
      if (err?.message?.includes('ORDER_EXISTS')) {
        addToast(t.orderExists, 'error')
      } else {
        addToast(err?.message || t.error, 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div dir={dir} style={{ padding: '120px 20px', textAlign: 'center' }}>
        <AlertCircle size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}>{t.signIn}</h2>
      </div>
    )
  }

  if (loading) {
    return <div dir={dir} style={{ padding: '120px 20px', textAlign: 'center' }}>{t.loading}</div>
  }

  if (!auction || !auction.winner || auction.winner.user_id !== user.id) {
    return (
      <div dir={dir} style={{ padding: '120px 20px', textAlign: 'center' }}>
        <AlertCircle size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, marginBottom: 8 }}>{t.error}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You are not the winner of this auction.</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate(`/auction/${id}`)}>
          <ArrowLeft size={14} /> {t.backToShop || 'Back'}
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div dir={dir} style={{ maxWidth: 540, margin: '0 auto', padding: 'clamp(24px, 5vw, 60px) clamp(12px, 3vw, 20px)', textAlign: 'center' }}>
        <CheckCircle size={64} strokeWidth={1} style={{ color: 'var(--gold)', marginBottom: 20 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: 300, marginBottom: 12 }}>{t.orderCreated}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          {t.orderNotes || 'Order'}: <strong>{success.order_number}</strong>
        </p>
        <p style={{ color: 'var(--gold)', fontSize: '1.3rem', fontWeight: 600, marginBottom: 32 }}>
          ${Number(success.total).toLocaleString()}
        </p>
        <button className="btn btn-gold" onClick={() => navigate('/')}>{t.continueShopping}</button>
      </div>
    )
  }

  const image = auction.images?.[0]?.url || auction.image_url || ''

  return (
    <div dir={dir} style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) clamp(12px, 3vw, 20px) 80px' }}>
      <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-secondary)', fontSize: '0.8rem' }} onClick={() => navigate(`/auction/${id}`)}>
        <ArrowLeft size={16} /> {t.backToShop || 'Back'}
      </button>

      <div className="section-label">{t.auctionCheckout}</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: 300, margin: '0 0 32px' }}>{t.completeOrder}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        {/* Order Summary */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg, 12px)', padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 20 }}>{t.auctionOrderSummary}</h3>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {image && (
              <img src={image} alt={auction.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{auction.brand}</div>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{auction.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)' }}>
                <Trophy size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t.wonAuction}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.winningAmount}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${Number(auction.winner.amount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.shippingInfo}</span>
              <span style={{ color: 'var(--gold)' }}>{t.freeShipping}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.total}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>${Number(auction.winner.amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Shipping Form */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg, 12px)', padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 20 }}>
            <Truck size={14} style={{ marginBottom: -2 }} /> {t.shippingInfo}
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.address}</label>
              <textarea
                value={form.shipping_address}
                onChange={e => setForm(prev => ({ ...prev, shipping_address: e.target.value }))}
                required
                rows={2}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.city}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.country}</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.orderNotes}</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder={dir === 'rtl' ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)'}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: '14px', fontSize: '0.85rem', fontWeight: 600 }} disabled={submitting}>
              {submitting ? t.loading : t.confirmOrder}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
