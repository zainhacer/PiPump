import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'

// Pages
import Home        from './pages/Home'
import TokenDetail from './pages/TokenDetail'
import CreateToken from './pages/CreateToken'
import Profile     from './pages/Profile'
import Admin       from './pages/Admin'

// Layout
import Navbar    from './components/layout/Navbar'
import BottomNav from './components/layout/BottomNav'

const BASE = import.meta.env.VITE_BASE_URL || '/pipump/'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={BASE}>
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#10101A',
              color:      '#E8E8F0',
              border:     '1px solid #1E1E2E',
              fontFamily: 'DM Sans, sans-serif',
              fontSize:   '14px',
            },
            success: {
              iconTheme: { primary: '#C8FF00', secondary: '#08080E' },
            },
            error: {
              iconTheme: { primary: '#FF4444', secondary: '#08080E' },
            },
          }}
        />

        {/* Top navbar — desktop */}
        <Navbar />

        {/* Main content */}
        <main className="pb-20 md:pb-0 min-h-screen">
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/token/:id"     element={<TokenDetail />} />
            <Route path="/create"        element={<CreateToken />} />
            <Route path="/profile/:uid"  element={<Profile />} />
            <Route path="/profile"       element={<Profile />} />
            <Route path="/admin"         element={<Admin />} />
          </Routes>
        </main>

        {/* Bottom navigation — mobile only */}
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  )
}
