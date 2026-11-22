import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DealerList from './pages/DealerList.jsx'
import DealerForm from './pages/DealerForm.jsx'
import DealerDetail from './pages/DealerDetail.jsx'
import IssueLetters from './pages/IssueLetters.jsx'
import Users from './pages/Users.jsx'
import Account from './pages/Account.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dealers" element={<DealerList />} />
          <Route path="/dealers/:id" element={<DealerDetail />} />
          <Route path="/issue-letters" element={<IssueLetters />} />
          <Route path="/account" element={<Account />} />
          {/* Admin and Back Office: add dealers / new dealer codes */}
          <Route element={<ProtectedRoute roles={['admin', 'back_office']} />}>
            <Route path="/dealers/new" element={<DealerForm />} />
          </Route>
          {/* Admin-only pages */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/dealers/:id/edit" element={<DealerForm />} />
            <Route path="/users" element={<Users />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
