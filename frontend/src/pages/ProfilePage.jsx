import React, { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Check, X } from 'lucide-react'

export default function ProfilePage() {
  const { t, dir, user, api, addToast } = useStore()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', location: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      const data = await api('/auth/me')
      setProfile(data)
      setForm({ name: data.name || '', phone: data.phone || '', location: data.location || '' })
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(form)
      })
      setProfile(data)
      setEditing(false)
      addToast(t.profileUpdated)
    } catch {
      addToast(t.error, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div dir={dir} style={{ padding: '120px 20px', textAlign: 'center' }}>
        <User size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}>{t.signIn}</h2>
      </div>
    )
  }

  if (!profile) {
    return <div dir={dir} style={{ padding: '120px 20px', textAlign: 'center' }}>{t.loading}</div>
  }

  const InfoRow = ({ icon: Icon, label, value, field }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold-soft, rgba(201,168,76,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color: 'var(--gold)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {editing && field ? (
          <input
            type="text"
            value={form[field]}
            onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
        ) : (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value || '—'}</div>
        )}
      </div>
    </div>
  )

  return (
    <div dir={dir} style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) clamp(12px, 3vw, 20px) 80px' }}>
      <div className="section-label">{t.myProfile}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 5vw, 2rem)', fontWeight: 300, margin: 0 }}>{t.profileInfo}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              <button className="btn btn-gold" style={{ fontSize: '0.68rem', padding: '8px 16px' }} onClick={handleSave} disabled={saving}>
                <Check size={14} /> {saving ? t.loading : t.saveChanges}
              </button>
              <button className="btn btn-outline" style={{ fontSize: '0.68rem', padding: '8px 12px' }} onClick={() => { setEditing(false); setForm({ name: profile.name || '', phone: profile.phone || '', location: profile.location || '' }) }}>
                <X size={14} /> {t.cancel}
              </button>
            </>
          ) : (
            <button className="btn btn-outline" style={{ fontSize: '0.68rem', padding: '8px 16px' }} onClick={() => setEditing(true)}>
              <Edit2 size={14} /> {t.editProfile}
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg, 12px)', padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--border-subtle)' }}>
        <InfoRow icon={User} label={t.fullName || t.registerName} value={profile.name} field="name" />
        <InfoRow icon={Mail} label={t.email} value={profile.email} />
        <InfoRow icon={Phone} label={t.phone || t.registerPhone} value={profile.phone} field="phone" />
        <InfoRow icon={MapPin} label={t.location} value={profile.location} field="location" />
        <InfoRow icon={Calendar} label={t.accountCreated} value={profile.created_at ? new Date(profile.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-IQ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
        <InfoRow icon={Shield} label={t.accountStatus} value={t[profile.status || 'active'] || t.active} />
      </div>
    </div>
  )
}
