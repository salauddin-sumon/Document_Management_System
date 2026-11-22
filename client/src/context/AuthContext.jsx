import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, ask the server who we are (the JWT lives in an httpOnly cookie)
  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // identifier = admin email, or staff ID for ZM/HOS and staff
  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password })
    setUser(res.data)
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  // Permission helpers used to show/hide buttons. The server enforces the same rules.
  const isAdmin = user?.role === 'admin'
  const isBackOffice = user?.role === 'back_office'
  const canIssueLetters = isAdmin || isBackOffice || user?.role === 'zm_hos'
  const canAddDealers = isAdmin || isBackOffice

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, canIssueLetters, canAddDealers }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
