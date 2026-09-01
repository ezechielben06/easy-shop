import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/common/Layout'
import BottomNav from './components/common/BottomNav'
import PWAInstallPrompt from './components/common/PWAInstallPrompt'
import ConnectionStatus from './components/common/ConnectionStatus'
// ❌ SUPPRIMER CETTE LIGNE
// import OfflineIndicator from './components/common/OfflineIndicator'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import NewSale from './pages/NewSale'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Stock from './pages/Stock'
import DailyInventory from './pages/DailyInventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Toaster 
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <ConnectionStatus />
          {/* ❌ SUPPRIMER CETTE LIGNE */}
          {/* <OfflineIndicator /> */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sales" element={<Sales />} />
                <Route path="sales/new" element={<NewSale />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="stock" element={<Stock />} />
                <Route path="inventory" element={<DailyInventory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
          <BottomNav />
          <PWAInstallPrompt />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App