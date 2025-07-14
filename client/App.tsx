import React, { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
}

interface AuthState {
  authenticated: boolean
  user?: User
  loading: boolean
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    loading: true
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      setAuthState({
        authenticated: data.authenticated,
        user: data.user,
        loading: false
      })
    } catch (error) {
      console.error('Error checking auth:', error)
      setAuthState({
        authenticated: false,
        loading: false
      })
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (authState.loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>Loading...</h2>
        </div>
      </div>
    )
  }

  if (!authState.authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', maxWidth: '28rem', width: '100%' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', textAlign: 'center' }}>
            Welcome to Web Starter
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#4b5563', marginBottom: '2rem', textAlign: 'center' }}>
            Please log in to continue
          </p>
          <button
            onClick={handleLogin}
            style={{ 
              width: '100%', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              fontWeight: '600', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
          >
            Log In with WorkOS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0fdf4, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', maxWidth: '28rem', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            Welcome, {authState.user?.name || authState.user?.email}!
          </h1>
          
          {authState.user?.picture && (
            <img 
              src={authState.user.picture} 
              alt="Profile" 
              style={{ 
                width: '6rem', 
                height: '6rem', 
                borderRadius: '50%', 
                margin: '0 auto 1.5rem', 
                border: '4px solid #a7f3d0' 
              }}
            />
          )}
          
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#374151' }}>Email:</span>
                <p style={{ color: '#4b5563', margin: '0.25rem 0 0' }}>{authState.user?.email}</p>
              </div>
              {authState.user?.name && (
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Name:</span>
                  <p style={{ color: '#4b5563', margin: '0.25rem 0 0' }}>{authState.user.name}</p>
                </div>
              )}
              <div>
                <span style={{ fontWeight: '600', color: '#374151' }}>User ID:</span>
                <p style={{ color: '#4b5563', fontSize: '0.875rem', wordBreak: 'break-all', margin: '0.25rem 0 0' }}>{authState.user?.id}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              backgroundColor: '#dc2626', 
              color: 'white', 
              fontWeight: '600', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default App