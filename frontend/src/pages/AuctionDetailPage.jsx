import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Timer, Users, Gavel, Trophy, TrendingUp, Clock, AlertCircle, Loader, ShoppingCart } from 'lucide-react'
import { useStore } from '../context/StoreContext'

// ── Inject auction-specific CSS once ─────────────────────
let _cssInjected = false
function injectCSS() {
  if (_cssInjected) return; _cssInjected = true
  const s = document.createElement('style')
  s.textContent = `
    @keyframes _auctionPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(76,201,168,0.5); }
      50% { box-shadow: 0 0 0 8px rgba(76,201,168,0); }
    }
    @keyframes _countGlow {
      0%, 100% { text-shadow: 0 0 12px rgba(201,168,76,0.3); }
      50% { text-shadow: 0 0 24px rgba(201,168,76,0.6); }
    }
    @keyframes _bidPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }
    ._auction-img:hover img { transform: scale(1.03); }
    ._auction-img img { transition: transform 0.6s ease; }
    ._bid-row:hover { background: rgba(201,168,76,0.04) !important; }
    ._count-box:hover { border-color: rgba(201,168,76,0.35) !important; transform: translateY(-2px); }
    ._count-box { transition: transform 0.2s ease, border-color 0.2s ease; }
  `
  document.head.appendChild(s)
}

// ── Relative time formatting ─────────────────────────────
function timeAgo(dateStr, t) {
  const now = new Date()
  const date = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'))
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}

// ── Status calculation ──────────────────────────────────
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

// ── Countdown calculation ────────────────────────────────
function getCountdown(targetDate) {
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  if (isNaN(target)) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  const diff = Math.max(0, target - now)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff
  }
}

// ── Status Badge Component ───────────────────────────────
function StatusBadge({ status, t }) {
  const styles = {
    live: {
      bg: 'rgba(76,201,168,0.15)',
      color: '#4cc9a8',
      border: 'rgba(76,201,168,0.4)',
      label: t.auctionLive || 'Live',
      animation: '_auctionPulse 2s ease-in-out infinite'
    },
    upcoming: {
      bg: 'rgba(100,149,237,0.15)',
      color: '#6495ed',
      border: 'rgba(100,149,237,0.4)',
      label: t.auctionUpcoming || 'Upcoming',
      animation: 'none'
    },
    ended: {
      bg: 'rgba(224,68,68,0.12)',
      color: '#9a9590',
      border: 'rgba(224,68,68,0.3)',
      label: t.auctionEnded || 'Ended',
      animation: 'none'
    }
  }
  const s = styles[status] || styles.ended
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '6px 14px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 20,
      fontSize: '0.62rem', fontWeight: 600,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: s.color,
      animation: s.animation,
      backdropFilter: 'blur(8px)'
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: s.color,
        boxShadow: status === 'live' ? `0 0 6px ${s.color}` : 'none'
      }} />
      {s.label}
    </div>
  )
}

// ── Countdown Timer Component ────────────────────────────
function CountdownTimer({ targetDate, label, t, onExpire }) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate))
  const expiredRef = React.useRef(false)

  useEffect(() => {
    expiredRef.current = false
    setCountdown(getCountdown(targetDate))
    const interval = setInterval(() => {
      const cd = getCountdown(targetDate)
      setCountdown(cd)
      if (cd.total <= 0 && !expiredRef.current) {
        expiredRef.current = true
        if (onExpire) onExpire()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate, onExpire])

  const units = [
    { value: countdown.days, label: t.days || 'Days' },
    { value: countdown.hours, label: t.hours || 'Hours' },
    { value: countdown.minutes, label: t.minutes || 'Min' },
    { value: countdown.seconds, label: t.seconds || 'Sec' }
  ]

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 14, fontSize: '0.65rem', fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--text-secondary)'
      }}>
        <Timer size={14} style={{ color: 'var(--gold)' }} />
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {units.map((unit, i) => (
          <div key={i} className="_count-box" style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 8px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* subtle gold glow at top */}
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
              background: 'linear-gradient(90deg, transparent, var(--gold-dark), transparent)',
              opacity: 0.5
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 4vw, 1.9rem)',
              fontWeight: 400,
              color: 'var(--gold)',
              lineHeight: 1,
              marginBottom: 6,
              animation: unit.value <= 10 && i === 3 ? '_countGlow 1s ease-in-out infinite' : 'none'
            }}>
              {String(unit.value).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: '0.52rem', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-muted)'
            }}>
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Auction Detail Page ─────────────────────────────
export default function AuctionDetailPage() {
  injectCSS()
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang, dir, user, setAuthOpen, api, addToast } = useStore()

  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [bidError, setBidError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)
  const [now, setNow] = useState(Date.now())

  // 1-second live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAuction = useCallback(() => {
    api(`/auctions/${id}`)
      .then(d => {
        setAuction(d)
        // Pre-fill minimum bid
        const minBid = d.current_highest_bid
          ? d.current_highest_bid + d.min_increment
          : d.starting_price
        setBidAmount(prev => prev === '' || Number(prev) < minBid ? minBid : prev)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, api])

  // Initial fetch + 3s live refresh
  useEffect(() => {
    setLoading(true); setError(''); setBidError('')
    fetchAuction()
    const interval = setInterval(fetchAuction, 3000)
    window.scrollTo(0, 0)
    return () => clearInterval(interval)
  }, [id, fetchAuction])

  const effectiveStatus = getEffectiveStatus(auction, now)
  const prevStatusRef = React.useRef(effectiveStatus)

  // When dynamic status transitions (e.g. upcoming -> live), re-fetch immediately
  useEffect(() => {
    if (prevStatusRef.current !== effectiveStatus) {
      prevStatusRef.current = effectiveStatus
      fetchAuction()
    }
  }, [effectiveStatus, fetchAuction])

  const handleBid = async () => {
    if (!user) { setAuthOpen(true); return }
    const minBid = auction.current_highest_bid
      ? auction.current_highest_bid + auction.min_increment
      : auction.starting_price
    if (Number(bidAmount) < minBid) {
      setBidError(`${t.bidTooLow || 'Minimum bid is'} $${minBid.toLocaleString()}`)
      return
    }
    try {
      setPlacing(true)
      await api(`/auctions/${id}/bid`, { method: 'POST', body: JSON.stringify({ amount: Number(bidAmount) }) })
      addToast(t.bidSuccess || 'Bid placed successfully!')
      setBidError('')
      fetchAuction()
    } catch (e) {
      setBidError(e.message)
    } finally {
      setPlacing(false)
    }
  }

  // ── Loading State ────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader size={32} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  // ── Error State ──────────────────────────────────────
  if (error || !auction) return (
    <div style={{ textAlign: 'center', padding: '120px 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, marginBottom: 16, color: 'var(--off-white)' }}>
        {error || (t.noAuctions || 'Auction not found')}
      </h2>
      <button className="btn btn-gold" onClick={() => navigate('/auctions')}>
        {t.viewAllAuctions || 'Back to Auctions'}
      </button>
    </div>
  )

  const hasBids = auction.bid_count > 0
  const currentPrice = hasBids ? auction.current_highest_bid : auction.starting_price
  const minBid = hasBids
    ? auction.current_highest_bid + auction.min_increment
    : auction.starting_price
  const bids = auction.bids || []

  const images = auction.images && auction.images.length > 0
    ? auction.images
    : [auction.image_url || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80']

  const renderImage = (mobile) => (
    <div style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.1s', opacity: 0 }}>
      <div className="_auction-img" style={{
        position: 'relative',
        borderRadius: mobile ? 0 : 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        border: mobile ? 'none' : '1px solid var(--border-subtle)',
        aspectRatio: mobile ? '4/3' : '1'
      }}>
        <img
          src={images[selectedImg] || images[0]}
          alt={auction.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Status badge — top left */}
        <div style={{ position: 'absolute', top: mobile ? 12 : 16, left: mobile ? 12 : 16 }}>
          <StatusBadge status={effectiveStatus} t={t} />
        </div>
        {/* Brand tag — top right */}
        <div style={{
          position: 'absolute', top: mobile ? 12 : 16, right: mobile ? 12 : 16,
          padding: '5px 12px',
          background: 'var(--gold-muted)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 2,
          fontSize: '0.58rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--gold)',
          backdropFilter: 'blur(8px)'
        }}>
          {auction.brand}
        </div>
        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
          pointerEvents: 'none'
        }} />
      </div>
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, marginTop: 12,
          padding: mobile ? '0 12px' : 0,
          overflowX: 'auto'
        }}>
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedImg(i)}
              style={{
                width: 64, height: 64, flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: i === selectedImg
                  ? '2px solid var(--gold)'
                  : '1px solid var(--border-subtle)',
                opacity: i === selectedImg ? 1 : 0.6,
                cursor: 'pointer',
                padding: 0, background: 'var(--bg-secondary)',
                transition: 'var(--transition)',
              }}
            >
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderDetails = (mobile) => (
    <div style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.1s', opacity: 0 }}>
      {/* Brand */}
      <div style={{
        fontSize: '0.62rem', fontWeight: 600,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'var(--gold)', marginBottom: 8
      }}>
        {auction.brand}
      </div>

      {/* Name */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: mobile ? 'clamp(1.5rem, 6vw, 2.2rem)' : 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 300, color: 'var(--off-white)',
        lineHeight: 1.15, marginBottom: 12
      }}>
        {auction.name}
      </h1>

      {/* Description */}
      {auction.description && (
        <p style={{
          fontSize: '0.88rem', color: 'var(--text-secondary)',
          lineHeight: 1.8, marginBottom: 20,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {auction.description}
        </p>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 20 }} />

      {/* ── Price & Bid Info ── */}
      <div style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.2s', opacity: 0 }}>
        {/* Current Price Label */}
        <div style={{
          fontSize: '0.6rem', fontWeight: 600,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--text-muted)', marginBottom: 6
        }}>
          {hasBids ? (t.currentBid || 'Current Highest Bid') : (t.startingPrice || 'Starting Price')}
        </div>

        {/* Current Price Value */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 2.6rem)',
          fontWeight: 400,
          color: 'var(--gold)',
          lineHeight: 1,
          marginBottom: 8
        }}>
          ${currentPrice.toLocaleString()}
        </div>

        {/* Starting price (if there are bids) */}
        {hasBids && (
          <div style={{
            fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6
          }}>
            {t.startingPrice || 'Starting Price'}: <span style={{ color: 'var(--text-secondary)' }}>${auction.starting_price.toLocaleString()}</span>
          </div>
        )}

        {/* Min Increment + Bidders row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          flexWrap: 'wrap', marginBottom: 20
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.72rem', color: 'var(--text-muted)'
          }}>
            <TrendingUp size={13} style={{ color: 'var(--gold-dark)' }} />
            {t.minIncrement || 'Min Increment'}: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>${auction.min_increment.toLocaleString()}</span>
          </div>
          {auction.bidder_count > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '0.72rem', color: 'var(--text-muted)'
            }}>
              <Users size={13} style={{ color: 'var(--gold-dark)' }} />
              {auction.bidder_count} {t.bidders || 'bidders'}
            </div>
          )}
        </div>
      </div>

      {/* ── Countdown Timer ── */}
      <div style={{ marginBottom: 24, animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
        {effectiveStatus === 'live' && (
          <CountdownTimer
            targetDate={auction.end_date}
            label={t.timeRemaining || 'Time Remaining'}
            t={t}
            onExpire={fetchAuction}
          />
        )}
        {effectiveStatus === 'upcoming' && (
          <CountdownTimer
            targetDate={auction.start_date}
            label={t.auctionStartsIn || 'Auction Starts In'}
            t={t}
            onExpire={fetchAuction}
          />
        )}
        {effectiveStatus === 'ended' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px',
            background: 'rgba(224,68,68,0.06)',
            border: '1px solid rgba(224,68,68,0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78rem', color: 'var(--text-secondary)'
          }}>
            <Clock size={16} style={{ color: '#9a9590', flexShrink: 0 }} />
            {t.auctionEndedMsg || 'This auction has ended'}
          </div>
        )}
      </div>

      {/* ── Bid Form / Status ── */}
      <div style={{ marginBottom: 28, animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.4s', opacity: 0 }}>
        {effectiveStatus === 'live' && (
          <>
            {!user ? (
              /* Not logged in */
              <div style={{
                padding: '20px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <Gavel size={24} style={{ color: 'var(--gold)', marginBottom: 10 }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                  {t.loginToBid || 'Sign in to place a bid'}
                </p>
                <button
                  className="btn btn-gold"
                  style={{ width: '100%', padding: '14px', fontSize: '0.72rem', letterSpacing: '0.15em' }}
                  onClick={() => setAuthOpen(true)}
                >
                  {t.signIn || 'Sign In'}
                </button>
              </div>
            ) : (
              /* Logged in — bid form */
              <div style={{
                padding: '22px',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.04), rgba(201,168,76,0.01))',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top gold accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--gold), transparent)'
                }} />

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                  fontSize: '0.68rem', fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--gold)'
                }}>
                  <Gavel size={15} />
                  {t.placeBid || 'Place Your Bid'}
                </div>

                <div style={{
                  fontSize: '0.65rem', color: 'var(--text-muted)',
                  marginBottom: 8
                }}>
                  {t.yourBid || 'Your Bid'} ({t.minIncrement || 'minimum'}: ${minBid.toLocaleString()})
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: bidError ? 10 : 0 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: '1.1rem', fontWeight: 500, color: 'var(--gold)',
                      pointerEvents: 'none'
                    }}>$</span>
                    <input
                      type="number"
                      className="input"
                      value={bidAmount}
                      onChange={e => { setBidAmount(e.target.value); setBidError('') }}
                      min={minBid}
                      step={auction.min_increment}
                      style={{
                        paddingLeft: 32,
                        fontSize: '1.1rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 400,
                        height: 52,
                        background: 'var(--bg-primary)',
                        border: `1px solid ${bidError ? 'rgba(224,68,68,0.5)' : 'var(--border)'}`,
                      }}
                    />
                  </div>
                </div>

                {bidError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.72rem', color: '#e04444', marginBottom: 10
                  }}>
                    <AlertCircle size={13} />
                    {bidError}
                  </div>
                )}

                <button
                  className="btn btn-gold"
                  disabled={placing}
                  onClick={handleBid}
                  style={{
                    width: '100%', padding: '15px', marginTop: 12,
                    fontSize: '0.75rem', letterSpacing: '0.15em',
                    opacity: placing ? 0.7 : 1,
                    position: 'relative'
                  }}
                >
                  {placing ? (
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <><Gavel size={15} /> {t.placeBid || 'Place Bid'}</>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {effectiveStatus === 'upcoming' && (
          <div style={{
            padding: '20px',
            background: 'rgba(100,149,237,0.05)',
            border: '1px solid rgba(100,149,237,0.2)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <Timer size={24} style={{ color: '#6495ed', marginBottom: 10 }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {t.auctionStartsIn || 'Auction hasn\'t started yet'}
            </p>
          </div>
        )}

        {effectiveStatus === 'ended' && auction.winner && (
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Gold shimmer at top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, var(--gold-dark), var(--gold-light), var(--gold-dark))'
            }} />
            <Trophy size={32} style={{ color: 'var(--gold)', marginBottom: 12 }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem', fontWeight: 400,
              color: 'var(--off-white)', marginBottom: 6
            }}>
              {t.auctionWinner || 'Winner'}: {auction.winner.user_name}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem', fontWeight: 400,
              color: 'var(--gold)', marginBottom: 8
            }}>
              ${auction.winner.amount?.toLocaleString()}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t.congratsWinner || 'Congratulations to the winner!'}
            </p>
            {user && auction.winner.user_id === user.id && (
              <button
                className="btn btn-gold"
                style={{ marginTop: 16, padding: '12px 28px', fontSize: '0.82rem', fontWeight: 600 }}
                onClick={() => navigate(`/auction/${auction.id}/checkout`)}
              >
                <ShoppingCart size={16} style={{ marginRight: dir === 'rtl' ? 0 : 6, marginLeft: dir === 'rtl' ? 6 : 0 }} />
                {t.proceedToCheckout || 'Proceed to Checkout'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Bid History ── */}
      <div style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.5s', opacity: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: '0.68rem', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={14} style={{ color: 'var(--gold)' }} />
            {t.bidHistory || 'Bid History'}
          </div>
          {auction.bid_count > 0 && (
            <span style={{
              padding: '3px 10px',
              background: 'var(--gold-muted)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 12,
              fontSize: '0.6rem', fontWeight: 600,
              color: 'var(--gold)'
            }}>
              {auction.bid_count} {t.bidders || 'bids'}
            </span>
          )}
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          {bids.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center'
            }}>
              <Gavel size={28} style={{ color: 'var(--text-muted)', marginBottom: 10, opacity: 0.4 }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {t.noBidsYet || 'No bids yet'}
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {bids.map((bid, i) => (
                <div key={bid.id} className="_bid-row" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < bids.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Avatar circle */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: i === 0 ? 'var(--gold-muted)' : 'var(--bg-card)',
                      border: `1px solid ${i === 0 ? 'var(--border)' : 'var(--border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.62rem', fontWeight: 600,
                      color: i === 0 ? 'var(--gold)' : 'var(--text-muted)',
                      flexShrink: 0
                    }}>
                      {bid.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.78rem', fontWeight: 500,
                        color: i === 0 ? 'var(--off-white)' : 'var(--text-primary)'
                      }}>
                        {bid.user_name}
                        {i === 0 && (
                          <span style={{
                            marginLeft: 8, padding: '1px 6px',
                            background: 'var(--gold-muted)',
                            border: '1px solid rgba(201,168,76,0.25)',
                            borderRadius: 2,
                            fontSize: '0.5rem', fontWeight: 600,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: 'var(--gold)',
                            verticalAlign: 'middle'
                          }}>
                            {t.highestBid || 'Highest'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {timeAgo(bid.created_at, t)}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: i === 0 ? '1.05rem' : '0.95rem',
                    fontWeight: 400,
                    color: i === 0 ? 'var(--gold)' : 'var(--gold-dark)',
                    flexShrink: 0
                  }}>
                    ${bid.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ── Render ───────────────────────────────────────────
  return (
    <div dir={dir} style={{ paddingBottom: 60 }}>

      {/* ── DESKTOP layout ── */}
      <div className="hide-mobile">
        <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>

          {/* Back button row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 28, animation: 'fadeIn 0.3s ease'
          }}>
            <button
              onClick={() => navigate('/auctions')}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.72rem', color: 'var(--text-muted)'
            }}>
              <button onClick={() => navigate('/')} style={{
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.72rem'
              }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                 onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                Home
              </button>
              <span>/</span>
              <button onClick={() => navigate('/auctions')} style={{
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.72rem'
              }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                 onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                {t.auctions || 'Auctions'}
              </button>
              <span>/</span>
              <span style={{ color: 'var(--text-secondary)' }}>{auction.name}</span>
            </div>
          </div>

          {/* Two-column grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 'clamp(28px, 5vw, 56px)',
            alignItems: 'start'
          }}>
            {/* Left — Image */}
            <div style={{ animation: 'fadeInUp 0.5s ease forwards', opacity: 0 }}>
              {renderImage(false)}
            </div>

            {/* Right — Details */}
            {renderDetails(false)}
          </div>
        </div>
      </div>

      {/* ── MOBILE layout ── */}
      <div className="show-mobile">
        {/* Sticky top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px',
          background: 'rgba(10,10,10,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => navigate('/auctions')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0
            }}
          >
            <ArrowLeft size={15} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--gold)'
            }}>
              {auction.brand}
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
            }}>
              {auction.name}
            </div>
          </div>
          <StatusBadge status={effectiveStatus} t={t} />
        </div>

        {/* Image */}
        {renderImage(true)}

        {/* Details */}
        <div style={{ padding: '20px 16px 0' }}>
          {renderDetails(true)}
        </div>
      </div>
    </div>
  )
}
