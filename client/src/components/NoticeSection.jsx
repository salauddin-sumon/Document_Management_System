import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from './Spinner.jsx'
import Badge from './Badge.jsx'
import Modal from './Modal.jsx'
import { EmptyState } from './ui.jsx'
import { formatDateTime, displayName } from '../utils/format.js'

const EMPTY = { title: '', message: '', priority: 'medium' }

// Internal notes about a dealer. These are never sent to the dealer.
// Everyone can read them; only admins can add, edit or delete.
export default function NoticeSection({ dealerId }) {
  const { isAdmin } = useAuth()
  const [notices, setNotices] = useState(null)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, notice = edit
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get(`/dealers/${dealerId}/notices`)
      .then((res) => setNotices(res.data))
      .catch((err) => toast.error(errorMessage(err)))
  }, [dealerId])

  const openNew = () => {
    setForm(EMPTY)
    setEditing({})
  }
  const openEdit = (n) => {
    setForm({ title: n.title, message: n.message, priority: n.priority })
    setEditing(n)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing._id) {
        const res = await api.put(`/notices/${editing._id}`, form)
        setNotices(notices.map((n) => (n._id === editing._id ? res.data : n)))
        toast.success('Notice updated')
      } else {
        const res = await api.post(`/dealers/${dealerId}/notices`, form)
        setNotices([res.data, ...notices])
        toast.success('Notice added')
      }
      setEditing(null)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (n) => {
    if (!confirm(`Delete notice "${n.title}"?`)) return
    try {
      await api.delete(`/notices/${n._id}`)
      setNotices(notices.filter((x) => x._id !== n._id))
      toast.success('Notice deleted')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (!notices) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Internal notes. The dealer never sees these.</p>
        {isAdmin && <button onClick={openNew} className="btn-primary">Add notice</button>}
      </div>

      {notices.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState title="No notices yet" />
        </div>
      ) : (
        <ul className="space-y-3">
          {notices.map((n) => (
            <li key={n._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-fg">{n.title}</h3>
                  <Badge value={n.priority} />
                </div>
                {isAdmin && (
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => openEdit(n)} className="link">Edit</button>
                    <button onClick={() => handleDelete(n)} className="cursor-pointer font-semibold text-danger hover:underline">Delete</button>
                  </div>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-fg">{n.message}</p>
              <p className="mt-2 text-xs text-muted">
                {displayName(n.createdBy)} · {formatDateTime(n.createdAt)}
                {n.updatedAt !== n.createdAt && ' · edited'}
              </p>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={editing._id ? 'Edit notice' : 'New notice'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
            </div>
            <div>
              <label className="label">Message *</label>
              <textarea className="input" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
