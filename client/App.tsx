import React, { useEffect, useState } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { OrganizationLogin } from './components/OrganizationLogin'

interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
}

interface AuthState {
  authenticated: boolean
  user?: User
  authProvider?: string
  loading: boolean
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    loading: true
  })
  const [showAdmin, setShowAdmin] = useState(false)

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
        authProvider: data.authProvider,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!authState.authenticated) {
    return <OrganizationLogin />
  }

  if (showAdmin) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-semibold">Web Starter</h1>
              <button
                onClick={() => setShowAdmin(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Welcome, {authState.user?.name || authState.user?.email}!
          </h1>
          
          {authState.user?.picture && (
            <img 
              src={authState.user.picture} 
              alt="Profile" 
              className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-emerald-200"
            />
          )}
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700">Email:</span>
                <p className="text-gray-600">{authState.user?.email}</p>
              </div>
              {authState.user?.name && (
                <div>
                  <span className="font-semibold text-gray-700">Name:</span>
                  <p className="text-gray-600">{authState.user.name}</p>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-700">User ID:</span>
                <p className="text-gray-600 text-sm break-all">{authState.user?.id}</p>
              </div>
              {authState.authProvider && (
                <div>
                  <span className="font-semibold text-gray-700">Auth Provider:</span>
                  <p className="text-gray-600">{authState.authProvider}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowAdmin(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Admin Panel
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App