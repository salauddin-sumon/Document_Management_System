import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../api/client.js'
import Spinner from '../components/Spinner.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner full />
  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(form.identifier, form.password)
      toast.success('Welcome back!')
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="font-mono text-lg font-bold break-all text-accent">Document_Management_System</h1>
          <p className="mt-3 text-2xl font-bold text-fg">Sign in <span className="text-lg font-normal text-muted">সাইন ইন</span></p>
          
        </div>
        <div>
          <label className="label" htmlFor="identifier">Staff ID <span className="font-normal text-muted">স্টাফ আইডি</span></label>
          <input
            id="identifier"
            className="input"
            placeholder="e.g. S-1001"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
            autoFocus
            autoComplete="username"
          />
          <p className="mt-1 text-xs text-faint">Sign in with your staff ID</p>
        </div>
        <div>
          <label className="label" htmlFor="password">Password <span className="font-normal text-muted">পাসওয়ার্ড</span></label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
