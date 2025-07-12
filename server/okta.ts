import { Router } from 'express';
import type { Request, Response } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { prisma } from './prisma';
import crypto from 'crypto';
import './types';

const oktaRouter = Router();

interface OktaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

interface OktaUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

// Get Okta configuration for an organization
oktaRouter.get('/api/okta/config/:organizationSlug', async (req: Request, res: Response) => {
  try {
    const { organizationSlug } = req.params;
    
    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { oktaConfig: true }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!organization.oktaConfig) {
      return res.status(404).json({ error: 'Okta configuration not found' });
    }

    // Return config without sensitive data
    const { clientSecret, ...publicConfig } = organization.oktaConfig;
    
    res.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      oktaConfig: publicConfig
    });
  } catch (error) {
    console.error('Error fetching Okta config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update Okta configuration (admin only)
oktaRouter.post('/api/okta/config', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const { organizationId, domain, clientId, clientSecret, redirectUri } = req.body;

    if (!organizationId || !domain || !clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Create or update Okta config
    const oktaConfig = await prisma.oktaConfig.upsert({
      where: { organizationId },
      update: {
        domain,
        clientId,
        clientSecret,
        redirectUri
      },
      create: {
        organizationId,
        domain,
        clientId,
        clientSecret,
        redirectUri
      }
    });

    res.json({ success: true, oktaConfig: { ...oktaConfig, clientSecret: '***' } });
  } catch (error) {
    console.error('Error saving Okta config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Okta login redirect
oktaRouter.get('/api/okta/login/:organizationSlug', async (req: Request, res: Response) => {
  try {
    const { organizationSlug } = req.params;
    
    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { oktaConfig: true }
    });

    if (!organization?.oktaConfig || !organization.oktaConfig.isActive) {
      return res.status(400).json({ error: 'Okta not configured for this organization' });
    }

    const { domain, clientId, redirectUri } = organization.oktaConfig;
    
    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oktaState = state;
    req.session.organizationId = organization.id;

    // Build Okta authorization URL
    const authUrl = new URL(`https://${domain}/oauth2/default/v1/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Okta login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Okta callback handler
oktaRouter.get('/api/okta/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state' });
    }

    // Verify state
    if (state !== req.session.oktaState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const organizationId = req.session.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization not found in session' });
    }

    // Get Okta config
    const oktaConfig = await prisma.oktaConfig.findUnique({
      where: { organizationId }
    });

    if (!oktaConfig) {
      return res.status(400).json({ error: 'Okta configuration not found' });
    }

    // Exchange code for tokens
    const tokenUrl = `https://${oktaConfig.domain}/oauth2/default/v1/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${oktaConfig.clientId}:${oktaConfig.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: oktaConfig.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokens: OktaTokenResponse = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(`https://${oktaConfig.domain}/oauth2/default/v1/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      const error = await userInfoResponse.text();
      console.error('Failed to fetch user info:', error);
      return res.status(400).json({ error: 'Failed to fetch user info' });
    }

    const userInfo: OktaUserInfo = await userInfoResponse.json();

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {
        name: userInfo.name,
        picture: userInfo.picture,
        organizationId
      },
      create: {
        auth0Id: `okta|${userInfo.sub}`,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        organizationId
      }
    });

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      organizationId: user.organizationId
    };

    // Clean up session
    delete req.session.oktaState;
    delete req.session.organizationId;

    res.redirect('/');
  } catch (error) {
    console.error('Error handling Okta callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle Okta activation
oktaRouter.put('/api/okta/config/:organizationId/toggle', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { isActive } = req.body;

    const oktaConfig = await prisma.oktaConfig.update({
      where: { organizationId },
      data: { isActive }
    });

    res.json({ success: true, isActive: oktaConfig.isActive });
  } catch (error) {
    console.error('Error toggling Okta config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create organization (admin only)
oktaRouter.post('/api/organizations', requiresAuth(), async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const organization = await prisma.organization.create({
      data: { name, slug }
    });

    res.json({ success: true, organization });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { oktaRouter };