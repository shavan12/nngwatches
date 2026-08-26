import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, Settings, Gavel, Trophy, AlertTriangle, Clock, Megaphone, TrendingUp, ChevronDown } from 'lucide-react'
import { useStore } from '../context/StoreContext'

const TYPE_CONFIG = {
  NEW_AUCTION:      { icon: Megaphone,     color: '#c9a84c', label: 'New Auction' },
  UPCOMING_AUCTION: { icon: Clock,         color: '#5ba4cf', label: 'Upcoming' },
  AUCTION_STARTED:  { icon: Megaphone,     color: '#27ae60', label: 'Started' },
  NEW_BID:          { icon: TrendingUp,    color: '#5ba4cf', label: 'New Bid' },
  OUTBID:           { icon: AlertTriangle, color: '#e74c3c', label: 'Outbid' },
  AUCTION_ENDING:   { icon: Clock,         color: '#e67e22', label: 'Ending Soon' },
  AUCTION_ENDED:    { icon: Gavel,         color: '#9a9590', label: 'Ended' },
  AUCTION_WON:      { icon: Trophy,        color: '#c9a84c', label: 'Won!' },
  AUCTION_LOST:     { icon: Gavel,         color: '#9a9590', label: 'Lost' },
  SYSTEM:           { icon: Bell,          color: '#9a9590', label: 'System' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr.replace(' ', 'T') + 'Z')
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const getPrefLabels = (t) => [
  { key: 'new_auctions',      label: t.newAuctions || 'New Auctions',         desc: t.newAuctionsDesc || 'When a new auction is created' },
  { key: 'upcoming_auctions', label: t.upcomingAuctions || 'Upcoming Auctions',    desc: t.upcomingAuctionsDesc || 'Reminders before auction starts' },
  { key: 'auction_started',   label: t.auctionStarted || 'Auction Started',      desc: t.auctionStartedDesc || 'When an auction goes live' },
  { key: 'new_bids',          label: t.newBids || 'New Bids',             desc: t.newBidsDesc || 'When someone bids on your auction' },
  { key: 'outbid',            label: t.outbidAlerts || 'Outbid Alerts',        desc: t.outbidAlertsDesc || 'When someone outbids you', mandatory: true },
  { key: 'auction_ending',    label: t.auctionEnding || 'Auction Ending',       desc: t.auctionEndingDesc || 'Reminders before auction ends' },
  { key: 'auction_results',   label: t.auctionResults || 'Auction Results',      desc: t.auctionResultsDesc || 'Win/loss notifications', mandatory: true },
]

export default function NotificationsPage() {
  const { t, lang, dir, notifications, unreadCount, fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, user, addToast, api, pushEnabled, subscribeToPush, unsubscribeFromPush } = useStore()
  const [activeTab, setActiveTab] = useState('all')
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState(null)
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user, activeTab])

  const loadNotifications = useCallback(async () => {
    try {
      const params = { limit: 30, offset: 0 }
      if (activeTab !== 'all') params.type = activeTab
      const res = await fetchNotifications(params)
      setHasMore((res?.data?.length || 0) < (res?.total || 0))
    } catch {}
  }, [activeTab, fetchNotifications])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const params = { limit: 30, offset: notifications.length }
      if (activeTab !== 'all') params.type = activeTab
      await fetchNotifications(params)
    } catch {}
    setLoadingMore(false)
  }

  const loadPrefs = async () => {
    try {
      const res = await api('/notifications/preferences')
      setPrefs(res)
    } catch {}
  }

  const savePrefs = async (key, value) => {
    const updated = { ...prefs, [key]: value ? 1 : 0 }
    setPrefs(updated)
    try {
      await api('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(updated),
      })
      addToast(t.profileUpdated || 'Preferences saved')
    } catch {
      addToast(t.error || 'Failed to save', 'error')
    }
  }

  useEffect(() => {
    if (showPrefs && !prefs) loadPrefs()
  }, [showPrefs])

  const handleClick = async (notif) => {
    if (!notif.is_read) await markNotificationRead(notif.id)
    if (notif.action_url) navigate(notif.action_url)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteNotification(id)
    addToast(t.deleted || 'Notification deleted')
  }

  if (!user) {
    return (
      <div dir={dir} style={{ padding: '120px 20px', textAlign: 'center' }}>
        <Bell size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, marginBottom: 8 }}>{t.signIn || 'Sign in to view notifications'}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You need an account to receive auction notifications.</p>
      </div>
    )
  }

  const [markingAll, setMarkingAll] = useState(false)

  const handleMarkAll = async () => {
    if (markingAll) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      addToast(t.allMarkedRead || 'All notifications marked as read')
    } catch {
      addToast(t.error || 'Failed to mark notifications read', 'error')
    } finally {
      setMarkingAll(false)
    }
  }

  const tabs = [
    { key: 'all', label: t.all || 'All' },
    { key: 'auctions', label: t.auctions || 'Auctions' },
    { key: 'bids', label: t.bids || 'Bids' },
    { key: 'results', label: t.results || 'Results' },
  ]

  const hasUnread = unreadCount > 0 || (notifications || []).some(n => !n.is_read)

  return (
    <div dir={dir} style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) clamp(12px, 3vw, 20px) 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <div>
          <div className="section-label">{t.notificationCenter || 'Notification Center'}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: 300, margin: 0 }}>{t.notifications || 'Notifications'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasUnread && (
            <button className="btn btn-outline" style={{ fontSize: '0.65rem', padding: '7px 12px', opacity: markingAll ? 0.6 : 1 }} onClick={handleMarkAll} disabled={markingAll}>
              <CheckCheck size={14} /> {markingAll ? (t.loading || '...') : (t.markAllRead || 'Mark All Read')}
            </button>
          )}
          <button
            className={`btn ${showPrefs ? 'btn-gold' : 'btn-outline'}`}
            style={{ fontSize: '0.65rem', padding: '7px 12px' }}
            onClick={() => setShowPrefs(v => !v)}
          >
            <Settings size={14} /> {t.settings || 'Settings'}
          </button>
        </div>
      </div>

      {/* Preferences panel */}
      {showPrefs && (
        <div className="notif-prefs-panel" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>{t.notifPreferences || 'Notification Preferences'}</h3>
          
          {/* Push Notifications toggle */}
          {'Notification' in window && (
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div className="notif-pref-row" style={{ paddingTop: 0 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>📱 {t.deviceNotifications || 'Device Notifications'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {pushEnabled 
                      ? 'You will receive notifications even when the website is closed' 
                      : 'Enable to get notifications on your device even when you\'re not on the website'}
                  </div>
                </div>
                <label className="notif-toggle">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={() => pushEnabled ? unsubscribeFromPush() : subscribeToPush()}
                  />
                  <span className="notif-toggle-slider" />
                </label>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>{t.notifCategories || 'Categories'}</div>
          {getPrefLabels(t).map(({ key, label, desc, mandatory }) => (
            <div key={key} className="notif-pref-row">
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>
              </div>
              <label className="notif-toggle">
                <input
                  type="checkbox"
                  checked={mandatory || (prefs ? prefs[key] !== 0 : true)}
                  disabled={mandatory}
                  onChange={(e) => savePrefs(key, e.target.checked)}
                />
                <span className="notif-toggle-slider" />
              </label>
            </div>
          ))}
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 12, fontStyle: 'italic' }}>
            Outbid alerts and auction results are mandatory and cannot be disabled.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="notif-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`notif-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="notif-page-list">
        {(notifications || []).length === 0 ? (
          <div className="notif-empty-page">
            <Bell size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, margin: '0 0 4px' }}>{t.noNotifications || 'No notifications'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t.allCaughtUp || "You're all caught up!"}</p>
          </div>
        ) : (
          (notifications || []).map(notif => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                className={`notif-page-item ${notif.is_read ? '' : 'unread'}`}
                onClick={() => handleClick(notif)}
              >
                {notif.image_url && (
                  <div className="notif-page-item-img">
                    <img src={notif.image_url} alt="" />
                  </div>
                )}
                <div className="notif-page-item-icon" style={{ background: `${config.color}20`, color: config.color }}>
                  <Icon size={18} />
                </div>
                <div className="notif-page-item-body">
                  <div className="notif-page-item-type" style={{ color: config.color }}>{t[notif.type] || config.label}</div>
                  <div className="notif-page-item-title">{lang === 'ar' && notif.title_ar ? notif.title_ar : notif.title}</div>
                  <div className="notif-page-item-message">{lang === 'ar' && notif.message_ar ? notif.message_ar : notif.message}</div>
                  <div className="notif-page-item-time">{timeAgo(notif.created_at)}</div>
                </div>
                <div className="notif-page-item-actions">
                  {!notif.is_read && (
                    <button
                      className="btn-ghost"
                      title="Mark as read"
                      style={{ padding: 6, borderRadius: '50%' }}
                      onClick={(e) => { e.stopPropagation(); markNotificationRead(notif.id) }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className="btn-ghost"
                    title="Delete"
                    style={{ padding: 6, borderRadius: '50%', color: 'var(--text-muted)' }}
                    onClick={(e) => handleDelete(e, notif.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}

        {hasMore && notifications.length > 0 && (
          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: 16, fontSize: '0.75rem' }}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? t.loading || 'Loading...' : t.loadMore || 'Load More'}
          </button>
        )}
      </div>
    </div>
  )
}
