import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS, displayName } from '../utils/format.js'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/dealers', label: 'Dealers' },
    { to: '/issue-letters', label: 'Letters' },
    ...(isAdmin ? [{ to: '/users', label: 'Users' }] : []),
    { to: '/account', label: 'Account' },
  ]

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  // Header links: white text on the green bar
  const linkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-white text-accent' : 'text-white/85 hover:bg-white/15 hover:text-white'
    }`

  return (
    <div className="min-h-screen">
      {/* Green bar with a red stripe underneath */}
      <header className="border-b-4 border-danger bg-accent text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <span className="truncate font-mono text-base font-bold text-white">Document Management System</span>
            <nav className="hidden gap-1 lg:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <span className="text-sm text-white/90">
              {displayName(user)} · <span className="text-white/70">{ROLE_LABELS[user.role]}</span>
            </span>
            <button onClick={handleLogout} className="btn border border-white/60 py-1.5 text-white hover:bg-white hover:text-accent">
              Log out
            </button>
          </div>
          <button
            className="btn border border-white/60 px-3 py-1.5 text-white lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
        {menuOpen && (
          <nav className="space-y-1 border-t border-white/20 px-4 py-3 lg:hidden">
            <p className="px-3 pb-2 text-sm text-white/80">
              {displayName(user)} · {ROLE_LABELS[user.role]}
            </p>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setMenuOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="btn mt-2 w-full border border-white/60 text-white">
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
