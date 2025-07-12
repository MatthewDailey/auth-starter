import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  slug: string;
  samlEnabled: boolean;
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  owner: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  _count: {
    teamMembers: number;
  };
}

interface TeamMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
  joinedAt: string;
}

export function OrganizationDetail() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSamlConfig, setShowSamlConfig] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [samlConfig, setSamlConfig] = useState({
    samlEnabled: false,
    samlEntryPoint: '',
    samlIssuer: '',
    samlCert: '',
  });
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchOrganization();
    fetchTeamMembers();
  }, [organizationId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.authenticated && data.user) {
        setCurrentUserId(data.user.id);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch organization');
      const data = await response.json();
      setOrganization(data.organization);
      setSamlConfig({
        samlEnabled: data.organization.samlEnabled,
        samlEntryPoint: data.organization.samlEntryPoint || '',
        samlIssuer: data.organization.samlIssuer || '',
        samlCert: data.organization.samlCert || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`);
      if (!response.ok) throw new Error('Failed to fetch team members');
      const data = await response.json();
      setTeamMembers(data.teamMembers);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleUpdateSamlConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(samlConfig),
      });

      if (!response.ok) throw new Error('Failed to update SAML configuration');
      
      const data = await response.json();
      setOrganization(data.organization);
      setShowSamlConfig(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SAML configuration');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite member');
      }

      if (data.teamMember) {
        setTeamMembers([...teamMembers, data.teamMember]);
      } else if (data.samlLoginUrl) {
        alert(`SAML authentication required. Direct the user to: ${window.location.origin}${data.samlLoginUrl}`);
      }

      setShowInviteForm(false);
      setInviteData({ email: '', role: 'MEMBER' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');
      
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      
      const data = await response.json();
      setTeamMembers(teamMembers.map(m => 
        m.id === memberId ? data.teamMember : m
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const isOwner = organization?.owner.id === currentUserId;
  const currentMember = teamMembers.find(m => m.user.id === currentUserId);
  const isAdmin = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading organization...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization not found</h1>
          <button
            onClick={() => navigate('/organizations')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/organizations')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to organizations
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600">/{organization.slug}</p>
          </div>
          
          {isOwner && (
            <button
              onClick={() => setShowSamlConfig(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Configure SAML
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {organization.samlEnabled && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-semibold">SAML authentication is enabled</p>
          <p className="text-sm mt-1">
            Login URL: {window.location.origin}/api/saml/login/{organization.id}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Team Members</h2>
          {isAdmin && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Invite Member
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {member.user.picture && (
                  <img
                    src={member.user.picture}
                    alt={member.user.name || member.user.email}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                )}
                <div>
                  <div className="font-medium">{member.user.name || member.user.email}</div>
                  <div className="text-sm text-gray-500">{member.user.email}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {isAdmin && member.role !== 'OWNER' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.id, e.target.value as 'ADMIN' | 'MEMBER')}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <span className="text-sm text-gray-600 capitalize">{member.role.toLowerCase()}</span>
                )}
                
                {isAdmin && member.role !== 'OWNER' && member.user.id !== currentUserId && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSamlConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Configure SAML Authentication</h2>
            <form onSubmit={handleUpdateSamlConfig}>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={samlConfig.samlEnabled}
                    onChange={(e) => setSamlConfig({ ...samlConfig, samlEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="font-medium">Enable SAML Authentication</span>
                </label>
              </div>

              {samlConfig.samlEnabled && (
                <>
                  <div className="mb-4">
                    <label htmlFor="samlEntryPoint" className="block text-sm font-medium text-gray-700 mb-2">
                      SAML Entry Point (Okta SSO URL)
                    </label>
                    <input
                      type="url"
                      id="samlEntryPoint"
                      value={samlConfig.samlEntryPoint}
                      onChange={(e) => setSamlConfig({ ...samlConfig, samlEntryPoint: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourcompany.okta.com/app/yourapp/sso/saml"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="samlIssuer" className="block text-sm font-medium text-gray-700 mb-2">
                      SAML Issuer (Entity ID)
                    </label>
                    <input
                      type="text"
                      id="samlIssuer"
                      value={samlConfig.samlIssuer}
                      onChange={(e) => setSamlConfig({ ...samlConfig, samlIssuer: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`${window.location.origin}/saml/${organization.id}`}
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="samlCert" className="block text-sm font-medium text-gray-700 mb-2">
                      SAML Certificate (X.509)
                    </label>
                    <textarea
                      id="samlCert"
                      value={samlConfig.samlCert}
                      onChange={(e) => setSamlConfig({ ...samlConfig, samlCert: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Okta Configuration</h3>
                    <p className="text-sm text-blue-800 mb-2">Use these values in your Okta application:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li><strong>Single Sign On URL:</strong> {window.location.origin}/api/saml/callback/{organization.id}</li>
                      <li><strong>Audience URI (SP Entity ID):</strong> {samlConfig.samlIssuer || `${window.location.origin}/saml/${organization.id}`}</li>
                      <li><strong>Name ID format:</strong> EmailAddress</li>
                    </ul>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSamlConfig(false);
                    setSamlConfig({
                      samlEnabled: organization.samlEnabled,
                      samlEntryPoint: organization.samlEntryPoint || '',
                      samlIssuer: organization.samlIssuer || '',
                      samlCert: organization.samlCert || '',
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
            <form onSubmit={handleInviteMember}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'ADMIN' | 'MEMBER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteData({ email: '', role: 'MEMBER' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}