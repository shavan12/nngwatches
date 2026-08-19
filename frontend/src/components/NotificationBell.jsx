import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, ChevronRight, Gavel, Trophy, AlertTriangle, Clock, Megaphone, TrendingUp, X } from 'lucide-react'
import { useStore } from '../context/StoreContext'

const TYPE_CONFIG = {
  NEW_AUCTION:      { icon: Megaphone,      color: '#c9a84c', label: 'New Auction' },
  UPCOMING_AUCTION: { icon: Clock,          color: '#5ba4cf', label: 'Upcoming' },
  AUCTION_STARTED:  { icon: Megaphone,      color: '#27ae60', label: 'Started' },
  NEW_BID:          { icon: TrendingUp,     color: '#5ba4cf', label: 'New Bid' },
  OUTBID:           { icon: AlertTriangle,  color: '#e74c3c', label: 'Outbid' },
  AUCTION_ENDING:   { icon: Clock,          color: '#e67e22', label: 'Ending Soon' },
  AUCTION_ENDED:    { icon: Gavel,          color: '#9a9590', label: 'Ended' },
  AUCTION_WON:      { icon: Trophy,         color: '#c9a84c', label: 'Won!' },
  AUCTION_LOST:     { icon: Gavel,          color: '#9a9590', label: 'Lost' },
  SYSTEM:           { icon: Bell,           color: '#9a9590', label: 'System' },
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

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markNotificationRead, markAllNotificationsRead, user, dir } = useStore()
  const [open, setOpen] = useState(false)
  const [mobileDrawer, setMobileDrawer] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open && user) {
      fetchNotifications({ limit: 20 })
    }
  }, [open, user])

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (!user) return null

  const handleOpen = (e) => {
    e.stopPropagation()
    if (isMobile) {
      setMobileDrawer(true)
    } else {
      setOpen(v => !v)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id)
    }
    setOpen(false)
    setMobileDrawer(false)
    if (notif.action_url) {
      navigate(notif.action_url)
    }
  }

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    await markAllNotificationsRead()
  }

  const recentNotifs = (notifications || []).slice(0, 20)

  const renderNotifItem = (notif) => {
    const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM
    const Icon = config.icon
    return (
      <button
        key={notif.id}
        className={`notif-item ${notif.is_read ? '' : 'unread'}`}
        onClick={() => handleNotificationClick(notif)}
      >
        <div className="notif-item-icon" style={{ background: `${config.color}20`, color: config.color }}>
          <Icon size={16} />
        </div>
        <div className="notif-item-body">
          <div className="notif-item-title">{notif.title}</div>
          <div className="notif-item-message">{notif.message}</div>
          <div className="notif-item-time">{timeAgo(notif.created_at)}</div>
        </div>
        {!notif.is_read && <div className="notif-unread-dot" />}
      </button>
    )
  }

  const dropdownContent = (
    <>
      <div className="notif-dropdown-header">
        <span className="notif-dropdown-title">Notifications</span>
        {unreadCount > 0 && (
          <button className="notif-mark-all" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="notif-dropdown-list">
        {recentNotifs.length === 0 ? (
          <div className="notif-empty">
            <Bell size={32} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <span>No notifications yet</span>
          </div>
        ) : (
          recentNotifs.map(renderNotifItem)
        )}
      </div>

      <button
        className="notif-dropdown-footer"
        onClick={() => { setOpen(false); setMobileDrawer(false); navigate('/notifications') }}
      >
        View All Notifications <ChevronRight size={14} />
      </button>
    </>
  )

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        className="btn-ghost notif-bell-btn"
        style={{ padding: 8, borderRadius: '50%', position: 'relative' }}
        onClick={handleOpen}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop dropdown */}
      {open && !isMobile && (
        <div className={`notif-dropdown ${dir === 'rtl' ? 'rtl' : ''}`}>
          {dropdownContent}
        </div>
      )}

      {/* Mobile drawer */}
      {mobileDrawer && (
        <>
          <div className="notif-mobile-overlay" onClick={() => setMobileDrawer(false)} />
          <div className="notif-mobile-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
              <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setMobileDrawer(false)}>
                <X size={20} />
              </button>
            </div>
            {dropdownContent}
          </div>
        </>
      )}
    </div>
  )
}
