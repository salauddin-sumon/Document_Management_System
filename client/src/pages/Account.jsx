import { useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../utils/format.js'

export default function Account() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return toast.error('New passwords do not match')
    setSaving(true)
    try {
      await api.put('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast.success('Password changed')
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const rows = [
    user.staffId ? ['Staff ID', user.staffId] : ['Email', user.email],
    ['Role', ROLE_LABELS[user.role]],
    ['Name', user.name],
    ['Designation', user.designation],
  ]

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-fg">My account <span className="ml-1 text-lg font-normal text-muted">অ্যাকাউন্ট</span></h1>
      <div className="card space-y-1 text-sm text-fg">
        {rows.map(([label, value]) => (
          <p key={label}>
            <span className="text-faint">{label}:</span> {value || '—'}
          </p>
        ))}
        <p className="pt-2 text-xs text-faint">Ask an admin to change your name or designation.</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="text-lg font-bold text-fg">Change password <span className="font-normal text-muted">পাসওয়ার্ড পরিবর্তন</span></h2>
        <div>
          <label className="label">Current password</label>
          <input type="password" className="input" value={form.currentPassword} onChange={set('currentPassword')} required />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" className="input" value={form.newPassword} onChange={set('newPassword')} minLength={6} required />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input type="password" className="input" value={form.confirm} onChange={set('confirm')} minLength={6} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
