import React, { useState } from 'react'

export function OrganizationLogin() {
  const [orgSlug, setOrgSlug] = useState('')
  const [useOkta, setUseOkta] = useState(false)

  const handleOktaLogin = () => {
    if (orgSlug) {
      window.location.href = `/api/okta/login/${orgSlug}`
    }
  }

  const handleAuth0Login = () => {
    window.location.href = '/api/auth/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">
          Welcome to Web Starter
        </h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Choose Login Method</h2>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="authMethod"
                  checked={!useOkta}
                  onChange={() => setUseOkta(false)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Auth0 (Default)</div>
                  <div className="text-sm text-gray-600">Standard authentication</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="authMethod"
                  checked={useOkta}
                  onChange={() => setUseOkta(true)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Okta (Organization SSO)</div>
                  <div className="text-sm text-gray-600">Sign in with your organization</div>
                </div>
              </label>
            </div>
          </div>

          {useOkta && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Code
              </label>
              <input
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="Enter your organization code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Contact your admin for your organization code
              </p>
            </div>
          )}

          <button
            onClick={useOkta ? handleOktaLogin : handleAuth0Login}
            disabled={useOkta && !orgSlug}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {useOkta ? 'Continue with Okta' : 'Continue with Auth0'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Demo Organizations:
          </p>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => {
                setUseOkta(true)
                setOrgSlug('acme-corp')
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
            >
              acme-corp
            </button>
            <button
              onClick={() => {
                setUseOkta(true)
                setOrgSlug('tech-startup')
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
            >
              tech-startup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}