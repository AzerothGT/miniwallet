import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.jsx'
import {
  AdminRoute,
  GuestRoute,
  ProtectedRoute,
} from './components/RouteGuards.jsx'
import AdminLogs from './pages/admin/AdminLogs.jsx'
import AdminOverview from './pages/admin/AdminOverview.jsx'
import AdminTransactions from './pages/admin/AdminTransactions.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Welcome from './pages/auth/Welcome.jsx'
import Dashboard from './pages/user/Dashboard.jsx'
import History from './pages/user/History.jsx'
import Profile from './pages/user/Profile.jsx'
import Report from './pages/user/Report.jsx'
import Topup from './pages/user/Topup.jsx'
import Transfer from './pages/user/Transfer.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest-only: signed-in users are redirected to their own area. */}
          <Route
            path="/"
            element={
              <GuestRoute>
                <Welcome />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          {/* Wallet holder. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/topup"
            element={
              <ProtectedRoute>
                <Topup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <Transfer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/*
            Administration. AdminRoute only hides the UI — authorisation lives on
            the server, where every /api/admin/* route re-checks the role.
          */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminOverview />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <AdminLogs />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
