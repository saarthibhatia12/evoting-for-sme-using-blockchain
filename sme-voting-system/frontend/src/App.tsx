import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ShareholderDashboard from './pages/ShareholderDashboard'
import ProposalDetail from './pages/ProposalDetail'
import './App.css'
import './types/global.d.ts'

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/shareholder" 
                  element={
                    <ProtectedRoute requireShareholder>
                      <ShareholderDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/proposals/:id" 
                  element={
                    <ProtectedRoute>
                      <ProposalDetail />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </WalletProvider>
  )
}

export default App
