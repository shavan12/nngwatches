import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer, Users, Gavel, TrendingUp, Clock, Radio } from 'lucide-react'
import { useStore } from '../context/StoreContext'

/* ── Status calculation ────────────────────────────────── */
function getEffectiveStatus(a, nowTime = Date.now()) {
  if (!a) return 'ended'
  if (a.manually_ended) return 'ended'
  const start = new Date(a.start_date).getTime()
  const end = new Date(a.end_date).getTime()
  if (isNaN(start) || isNaN(end)) return a.status || 'ended'
  if (nowTime < start) return 'upcoming'
  if (nowTime >= start && nowTime <= end) return 'live'
  return 'ended'
}

/* ── Countdown helpers ──────────────────────────── */
function getTimeLeft(target, nowTime = Date.now()) {
  const targetMs = new Date(target).getTime()
  if (isNaN(targetMs)) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  const diff = targetMs - nowTime
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    expired: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function useCountdown(targetDate, onExpire) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))
  const expiredRef = useRef(false)

  useEffect(() => {
    expiredRef.current = false
    const initial = getTimeLeft(targetDate)
    setTimeLeft(initial)
    if (initial.expired && onExpire) onExpire()

    const timer = setInterval(() => {
      const current = getTimeLeft(targetDate)
      setTimeLeft(current)
      if (current.expired && !expiredRef.current) {
        expiredRef.current = true
        if (onExpire) onExpire()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate, onExpire])
  return timeLeft
}

/* ── Compact countdown display ──────────────────── */
function CountdownCompact({ targetDate, label, t, onExpire }) {
  const { expired, days, hours, minutes, seconds } = useCountdown(targetDate, onExpire)
  if (expired) return null

  const parts = []
  if (days > 0) parts.push(`${days}${t.days?.[0] || 'd'}`)
  parts.push(`${hours}${t.hours?.[0] || 'h'}`)
  parts.push(`${minutes}${t.minutes?.[0] || 'm'}`)
  if (days === 0) parts.push(`${seconds}${t.seconds?.[0] || 's'}`)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.68rem', color: 'var(--text-secondary)',
      fontFamily: 'var(--font-body)', fontWeight: 500,
      letterSpacing: '0.04em',
    }}>
      <Clock size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />
      {label && <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{label}</span>}
      <span style={{
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--gold-light)',
      }}>
        {parts.join(' ')}
      </span>
    </div>
  )
}

/* ── Status badge ───────────────────────────────── */
function StatusBadge({ status, t }) {
  const styles = {
    live: {
      bg: 'rgba(34,197,94,0.15)',
      border: 'rgba(34,197,94,0.4)',
      color: '#22c55e',
      label: t.auctionLive || 'LIVE',
    },
    upcoming: {
      bg: 'rgba(59,130,246,0.15)',
      border: 'rgba(59,130,246,0.4)',
      color: '#3b82f6',
      label: t.auctionUpcoming || 'UPCOMING',
    },
    ended: {
      bg: 'rgba(120,113,108,0.15)',
      border: 'rgba(120,113,108,0.35)',
      color: '#78716c',
      label: t.auctionEnded || 'ENDED',
    },
  }
  const s = styles[status] || styles.ended

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 3,
      fontSize: '0.55rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: s.color,
      backdropFilter: 'blur(8px)',
    }}>
      {status === 'live' && (
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
          animation: 'pulse 1.5s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      {s.label}
    </div>
  )
}

/* ── Auction card ───────────────────────────────── */
function AuctionCard({ auction, index, t, dir, now, onExpire }) {
  const navigate = useNavigate()
  const effectiveStatus = getEffectiveStatus(auction, now)
  const isLive = effectiveStatus === 'live'
  const isUpcoming = effectiveStatus === 'upcoming'
  const isEnded = effectiveStatus === 'ended'
  const price = isLive
    ? (auction.current_highest_bid || auction.starting_price)
    : auction.starting_price

  const countdownTarget = isLive ? auction.end_date : auction.start_date
  const countdownLabel = isLive ? (t.timeRemaining || 'Ends') : (t.auctionStartsIn || 'Starts')

  return (
    <div
      className="animate-fadeInUp"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div
        className="product-card"
        onClick={() => navigate(`/auction/${auction.id}`)}
        style={{ position: 'relative' }}
      >
        {/* Image */}
        <div className="product-card-img">
          <img
            src={(auction.images && auction.images[0]) || auction.image_url || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80'}
            alt={auction.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Status badge overlay */}
          <div style={{
            position: 'absolute',
            top: 8,
            [dir === 'rtl' ? 'right' : 'left']: 8,
          }}>
            <StatusBadge status={effectiveStatus} t={t} />
          </div>
          {/* Gradient overlay for ended auctions */}
          {isEnded && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Body */}
        <div className="product-card-body">
          {/* Brand */}
          <div className="product-card-brand">{auction.brand}</div>
          {/* Name */}
          <div className="product-card-name">{auction.name}</div>

          {/* Price line */}
          <div style={{ marginTop: 6, marginBottom: 6 }}>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 2,
            }}>
              {isLive
                ? (t.currentBid || 'Current Bid')
                : isUpcoming
                  ? (t.startingPrice || 'Starting Price')
                  : (t.highestBid || 'Final Bid')
              }
            </div>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.92rem',
              fontWeight: 700,
              color: isLive ? 'var(--gold)' : isEnded ? 'var(--text-secondary)' : 'var(--off-white)',
              letterSpacing: '0.02em',
            }}>
              ${Number(price).toLocaleString()}
            </span>
          </div>

          {/* Countdown */}
          {!isEnded && (
            <div style={{ marginBottom: 4 }}>
              <CountdownCompact
                targetDate={countdownTarget}
                label={countdownLabel}
                t={t}
                onExpire={onExpire}
              />
            </div>
          )}

          {/* Bidders count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            marginTop: 4,
          }}>
            <Users size={10} style={{ flexShrink: 0 }} />
            <span>{auction.bid_count || 0} {t.bidders || 'bidders'}</span>
          </div>
        </div>

        {/* Live glow effect */}
        {isLive && (
          <div style={{
            position: 'absolute', inset: -1,
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(34,197,94,0.2)',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  )
}

/* ── Skeleton card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '1' }} />
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 10, borderRadius: 4, width: '40%' }} />
        <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 4, width: '55%' }} />
        <div className="skeleton" style={{ height: 10, borderRadius: 4, width: '30%' }} />
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────── */
export default function AuctionsPage() {
  const { t, dir, lang, api } = useStore()
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [now, setNow] = useState(Date.now())

  // 1-second live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const tabs = useMemo(() => [
    { key: 'all',      label: t.all || 'All' },
    { key: 'live',     label: t.auctionLive || 'Live' },
    { key: 'upcoming', label: t.auctionUpcoming || 'Upcoming' },
    { key: 'ended',    label: t.auctionEnded || 'Ended' },
  ], [t])

  const loadAuctions = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true)
    const endpoint = activeTab === 'all'
      ? '/auctions'
      : `/auctions?status=${activeTab}`
    api(endpoint)
      .then(res => setAuctions(res.data || []))
      .catch(() => setAuctions([]))
      .finally(() => { if (showLoading) setLoading(false) })
  }, [activeTab, api])

  // Initial fetch on tab change
  useEffect(() => {
    loadAuctions(true)
  }, [loadAuctions])

  // 5-second polling interval
  useEffect(() => {
    const interval = setInterval(() => loadAuctions(false), 5000)
    return () => clearInterval(interval)
  }, [loadAuctions])

  return (
    <div dir={dir} style={{ padding: '32px 0 80px' }}>
      <div className="container">

        {/* ── Page header ──────────────────────────── */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Gavel size={12} />
            {t.auctions || 'Auctions'}
          </div>
          <h1 className="section-title" style={{ marginBottom: 8 }}>
            {lang === 'ar' ? 'المزادات الحصرية' : 'Exclusive Auctions'}
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            {lang === 'ar'
              ? 'اكتشف ساعات نادرة واستثنائية في مزاداتنا الحصرية'
              : 'Discover rare and exceptional timepieces in our exclusive auctions'}
          </p>
        </div>

        {/* ── Decorative divider ───────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, marginBottom: 28,
        }}>
          <div style={{ height: 1, width: 60, background: 'linear-gradient(to right, transparent, var(--border))' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', opacity: 0.5 }} />
          <div style={{ height: 1, width: 60, background: 'linear-gradient(to left, transparent, var(--border))' }} />
        </div>

        {/* ── Filter tabs ──────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          marginBottom: 36,
          flexWrap: 'wrap',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                className="btn btn-ghost"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  borderRadius: 0,
                  transition: 'var(--transition)',
                  background: isActive ? 'var(--gold-muted)' : 'transparent',
                  position: 'relative',
                }}
              >
                {tab.key === 'live' && (
                  <span style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: isActive ? '#22c55e' : 'var(--text-muted)',
                    display: 'inline-block',
                    marginRight: dir === 'rtl' ? 0 : 6,
                    marginLeft: dir === 'rtl' ? 6 : 0,
                    boxShadow: isActive ? '0 0 6px #22c55e' : 'none',
                    animation: isActive ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }} />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Grid content ─────────────────────────── */}
        {loading ? (
          /* Loading skeletons */
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
          }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: 'var(--gold-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid var(--border)',
            }}>
              <Gavel size={24} style={{ color: 'var(--gold)' }} />
            </div>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              marginBottom: 8,
            }}>
              {t.noAuctions || 'No auctions found'}
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              opacity: 0.7,
            }}>
              {lang === 'ar' ? 'تحقق مرة أخرى قريبًا' : 'Check back soon for new listings'}
            </p>
          </div>
        ) : (
          /* Auction cards grid */
          <div className="product-grid">
            {auctions.map((auction, i) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                index={i}
                t={t}
                dir={dir}
                now={now}
                onExpire={() => loadAuctions(false)}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Pulse keyframe for live dot ────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
    </div>
  )
}
