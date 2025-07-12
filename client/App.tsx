import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Organizations } from './components/Organizations'
import { OrganizationDetail } from './components/OrganizationDetail'

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
  authType?: 'auth0' | 'saml'
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
        loading: false,
        authType: data.authType
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!authState.authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">
            Welcome to Web Starter
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Please log in to continue
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Log In with Auth0
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  Web Starter
                </Link>
                <Link
                  to="/organizations"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Organizations
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {authState.user?.picture && (
                    <img
                      src={authState.user.picture}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    {authState.user?.name || authState.user?.email}
                  </span>
                  {authState.authType && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {authState.authType.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white p-8 rounded-lg shadow">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Web Starter
                </h1>
                <p className="text-gray-600 mb-6">
                  You're successfully authenticated! Navigate to Organizations to manage your teams.
                </p>
                <Link
                  to="/organizations"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  View Organizations
                </Link>
              </div>
            </div>
          } />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/:organizationId" element={<OrganizationDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App