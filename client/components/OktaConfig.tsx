import React, { useState, useEffect } from 'react'

interface OktaConfigData {
  id: string
  domain: string
  clientId: string
  clientSecret: string
  redirectUri: string
  isActive: boolean
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface OktaConfigProps {
  organizationId: string
}

export function OktaConfig({ organizationId }: OktaConfigProps) {
  const [config, setConfig] = useState<OktaConfigData | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    domain: '',
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/api/okta/callback'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchOrganization()
  }, [organizationId])

  const fetchOrganization = async () => {
    try {
      // In a real app, this would fetch the organization details
      // For now, we'll use a placeholder
      setOrganization({
        id: organizationId,
        name: 'Demo Organization',
        slug: 'demo-org'
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching organization:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/okta/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          ...formData
        })
      })

      if (response.ok) {
        setMessage('Okta configuration saved successfully!')
        const data = await response.json()
        setConfig(data.oktaConfig)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivation = async () => {
    if (!config) return

    try {
      const response = await fetch(`/api/okta/config/${organizationId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !config.isActive
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfig({ ...config, isActive: data.isActive })
        setMessage(`Okta ${data.isActive ? 'activated' : 'deactivated'} successfully!`)
      }
    } catch (error) {
      console.error('Error toggling activation:', error)
      setMessage('Failed to toggle activation')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Okta Configuration</h2>
      
      {organization && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h3 className="font-semibold">Organization: {organization.name}</h3>
          <p className="text-sm text-gray-600">Slug: {organization.slug}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Okta Domain
          </label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="your-org.okta.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Your Okta domain without https://
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            value={formData.clientSecret}
            onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Redirect URI
          </label>
          <input
            type="text"
            value={formData.redirectUri}
            onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Add this URI to your Okta app's redirect URIs
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      {config && (
        <div className="mt-6">
          <button
            onClick={toggleActivation}
            className={`w-full py-2 px-4 rounded-md font-semibold transition duration-200 ${
              config.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {config.isActive ? 'Deactivate Okta' : 'Activate Okta'}
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {organization && config?.isActive && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Test Okta Login</h4>
          <p className="text-sm text-gray-600 mb-3">
            Users can sign in with Okta using this URL:
          </p>
          <code className="block p-2 bg-gray-100 rounded text-sm">
            {window.location.origin}/api/okta/login/{organization.slug}
          </code>
        </div>
      )}
    </div>
  )
}