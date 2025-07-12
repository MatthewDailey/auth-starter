import React, { useState } from 'react'
import { OktaConfig } from './OktaConfig'

interface Organization {
  id: string
  name: string
  slug: string
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('organizations')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [newOrg, setNewOrg] = useState({ name: '', slug: '' })
  const [creating, setCreating] = useState(false)

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrg)
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations([...organizations, data.organization])
        setNewOrg({ name: '', slug: '' })
      }
    } catch (error) {
      console.error('Error creating organization:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('organizations')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'organizations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Organizations
              </button>
              <button
                onClick={() => setActiveTab('okta')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'okta'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Okta Configuration
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'organizations' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Manage Organizations</h2>
                
                <form onSubmit={createOrganization} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Create New Organization</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Organization Name"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    <input
                      type="text"
                      placeholder="URL Slug (lowercase, no spaces)"
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md"
                  >
                    {creating ? 'Creating...' : 'Create Organization'}
                  </button>
                </form>

                <div className="space-y-2">
                  {organizations.length === 0 ? (
                    <p className="text-gray-500">No organizations created yet.</p>
                  ) : (
                    organizations.map((org) => (
                      <div
                        key={org.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedOrg(org.id)
                          setActiveTab('okta')
                        }}
                      >
                        <h4 className="font-medium">{org.name}</h4>
                        <p className="text-sm text-gray-600">Slug: {org.slug}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'okta' && (
              <div>
                {selectedOrg ? (
                  <OktaConfig organizationId={selectedOrg} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Please select an organization from the Organizations tab</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}