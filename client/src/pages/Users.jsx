import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate, ROLE_LABELS } from '../utils/format.js'
import PasswordInput from '../components/PasswordInput.jsx'

const EMPTY = { role: 'staff', staffId: '', email: '', name: '', designation: '', password: '' }

const ROLE_HELP = {
  admin: 'Full access. Logs in with email.',
  zm_hos: 'Can view everything and add issue letters. Logs in with staff ID.',
  staff: 'View only. Logs in with staff ID.',
}

// Admin only: manage the accounts that can log in
export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => toast.error(errorMessage(err)))
  }, [])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const isAdminRole = form.role === 'admin'

  const openCreate = () => {
    setForm(EMPTY)
    setCreating(true)
  }
  const openEdit = (u) => {
    setForm({
      ...EMPTY,
      role: u.role,
      staffId: u.staffId || '',
      email: u.email || '',
      name: u.name || '',
      designation: u.designation || '',
    })
    setEditing(u)
  }
  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const body = { name: form.name, designation: form.designation, role: form.role }
        if (isAdminRole) body.email = form.email
        else body.staffId = form.staffId
        if (form.password) body.password = form.password
        const res = await api.put(`/users/${editing._id}`, body)
        setUsers(users.map((u) => (u._id === editing._id ? res.data : u)))
        toast.success(form.password ? 'User updated and password reset' : 'User updated')
      } else {
        const res = await api.post('/users', form)
        setUsers([res.data, ...users])
        toast.success('User created')
      }
      close()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!confirm(`Remove ${u.staffId || u.email}? They will no longer be able to log in.`)) return
    try {
      await api.delete(`/users/${u._id}`)
      setUsers(users.filter((x) => x._id !== u._id))
      toast.success('User removed')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (!users) return <Spinner />

  // When editing, admins stay admins and non-admins stay non-admins (their login type differs)
  const roleOptions = editing
    ? editing.role === 'admin'
      ? ['admin']
      : ['zm_hos', 'staff']
    : ['staff', 'zm_hos', 'admin']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-fg">Users <span className="ml-1 text-lg font-normal text-muted">ব্যবহারকারী</span></h1>
        <button onClick={openCreate} className="btn-primary">Add user</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className="th ">Login</th>
              <th className="th ">Role</th>
              <th className="th hidden  sm:table-cell">Name</th>
              <th className="th hidden  md:table-cell">Designation</th>
              <th className="th hidden  lg:table-cell">Added</th>
              <th className="th "></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="td  font-medium text-fg">
                  <span className={u.staffId ? 'font-mono' : ''}>{u.staffId || u.email}</span>
                  {u._id === me._id && <span className="ml-2 text-xs text-faint">(you)</span>}
                </td>
                <td className="td "><Badge value={u.role} label={ROLE_LABELS[u.role]} /></td>
                <td className="td hidden  text-muted sm:table-cell">{u.name || '—'}</td>
                <td className="td hidden  text-muted md:table-cell">{u.designation || '—'}</td>
                <td className="td hidden  text-muted lg:table-cell">{formatDate(u.createdAt)}</td>
                <td className="td whitespace-nowrap  text-right">
                  <button onClick={() => openEdit(u)} className="mr-3 cursor-pointer text-accent hover:underline">
                    Edit
                  </button>
                  {u._id !== me._id && (
                    <button onClick={() => handleDelete(u)} className="cursor-pointer text-danger hover:underline">
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <Modal title={editing ? `Edit ${editing.staffId || editing.email}` : 'Add user'} onClose={close}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Role *</label>
              <select
                className="input"
                value={form.role}
                onChange={set('role')}
                disabled={editing && (editing._id === me._id || roleOptions.length === 1)}
              >
                {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted">{ROLE_HELP[form.role]}</p>
            </div>

            {isAdminRole ? (
              <div>
                <label className="label">Email * (used to log in)</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} required />
              </div>
            ) : (
              <div>
                <label className="label">Staff ID * (used to log in)</label>
                <input className="input font-mono" value={form.staffId} onChange={set('staffId')} required />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name (optional)</label>
                <input className="input" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Designation (optional)</label>
                <input className="input" value={form.designation} onChange={set('designation')} />
              </div>
            </div>
            <p className="-mt-2 text-xs text-faint">Name and designation pre-fill the issuer on issue letters.</p>

            <div>
              <label className="label">
                {editing ? 'New password (leave blank to keep current)' : 'Password * (min 6 characters)'}
              </label>
              <PasswordInput
                value={form.password}
                onChange={set('password')}
                minLength={6}
                required={!editing}
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
