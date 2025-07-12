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

  const handleLogout = () => {
    window.location.href = '/api/auth/logout'
  }

  if (authState.loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  if (!authState.authenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Welcome to Web Starter</h1>
          <p style={styles.subtitle}>Please log in to continue</p>
          <button onClick={handleLogin} style={styles.button}>
            Log In with Auth0
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome, {authState.user?.name || authState.user?.email}!</h1>
        {authState.user?.picture && (
          <img 
            src={authState.user.picture} 
            alt="Profile" 
            style={styles.avatar}
          />
        )}
        <div style={styles.userInfo}>
          <p><strong>Email:</strong> {authState.user?.email}</p>
          {authState.user?.name && <p><strong>Name:</strong> {authState.user.name}</p>}
          <p><strong>User ID:</strong> {authState.user?.id}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#333'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px'
  },
  button: {
    backgroundColor: '#635BFF',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '20px'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    marginBottom: '20px'
  },
  userInfo: {
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '6px',
    marginTop: '20px'
  }
}

export default App