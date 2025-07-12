# Okta OAuth Setup Guide

This guide explains how to set up Okta OAuth for your organization in the Web Starter application.

## Overview

The application supports multi-tenant Okta authentication, allowing different organizations to configure their own Okta SSO. Users can choose between standard Auth0 authentication or organization-specific Okta SSO.

## Prerequisites

- An Okta developer account or organization account
- Admin access to create OAuth applications in Okta
- Access to the Web Starter admin panel

## Step 1: Create an Okta Application

1. Log in to your Okta Admin Console
2. Navigate to **Applications** > **Applications**
3. Click **Create App Integration**
4. Select:
   - **Sign-in method**: OIDC - OpenID Connect
   - **Application type**: Web Application
5. Click **Next**

## Step 2: Configure the Okta Application

1. **App integration name**: Choose a name (e.g., "Web Starter SSO")
2. **Grant type**: Ensure "Authorization Code" is checked
3. **Sign-in redirect URIs**: Add your callback URL:
   ```
   https://your-domain.com/api/okta/callback
   ```
   For local development:
   ```
   http://localhost:3000/api/okta/callback
   ```
4. **Sign-out redirect URIs**: (Optional) Add your app's base URL
5. **Controlled access**: Choose who can access the application
6. Click **Save**

## Step 3: Collect Okta Credentials

After creating the application, collect the following information:

1. **Client ID**: Found on the application's General tab
2. **Client Secret**: Found on the application's General tab (keep this secure!)
3. **Okta Domain**: Your Okta domain (e.g., `your-org.okta.com`)

## Step 4: Configure Okta in Web Starter

### For Administrators:

1. Log in to Web Starter with your Auth0 admin account
2. Navigate to the **Admin Panel**
3. Go to the **Organizations** tab
4. Create a new organization:
   - **Name**: Your organization's display name
   - **Slug**: A unique identifier (lowercase, no spaces)
5. Switch to the **Okta Configuration** tab
6. Select your organization
7. Enter the Okta configuration:
   - **Okta Domain**: Your domain without `https://` (e.g., `your-org.okta.com`)
   - **Client ID**: The Client ID from Okta
   - **Client Secret**: The Client Secret from Okta
   - **Redirect URI**: Should match what you configured in Okta
8. Click **Save Configuration**
9. Click **Activate Okta** to enable SSO for the organization

## Step 5: Test Okta Login

### For End Users:

1. Navigate to the Web Starter login page
2. Select **Okta (Organization SSO)**
3. Enter your organization code (the slug created by your admin)
4. Click **Continue with Okta**
5. You'll be redirected to your Okta login page
6. Sign in with your Okta credentials
7. You'll be redirected back to Web Starter, logged in

### Direct Login URL:

Users can also directly access:
```
https://your-domain.com/api/okta/login/[organization-slug]
```

## Database Schema

The Okta integration uses the following database structure:

```prisma
model Organization {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  users         User[]
  oktaConfig    OktaConfig?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model OktaConfig {
  id               String   @id @default(uuid())
  organizationId   String   @unique
  organization     Organization @relation(fields: [organizationId], references: [id])
  domain           String
  clientId         String
  clientSecret     String
  redirectUri      String
  isActive         Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model User {
  id            String   @id @default(uuid())
  auth0Id       String   @unique
  email         String   @unique
  name          String?
  picture       String?
  organizationId String?
  organization  Organization? @relation(fields: [organizationId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## API Endpoints

### Public Endpoints:
- `GET /api/okta/config/:organizationSlug` - Get Okta config status for an organization
- `GET /api/okta/login/:organizationSlug` - Initiate Okta login flow
- `GET /api/okta/callback` - OAuth callback handler

### Admin Endpoints (Requires Auth0 Authentication):
- `POST /api/organizations` - Create a new organization
- `POST /api/okta/config` - Create/update Okta configuration
- `PUT /api/okta/config/:organizationId/toggle` - Enable/disable Okta for an organization

## Security Considerations

1. **Client Secret**: Never expose the client secret in frontend code or public repositories
2. **HTTPS**: Always use HTTPS in production for OAuth flows
3. **State Parameter**: The implementation includes CSRF protection using state parameters
4. **Session Security**: Sessions are configured with secure cookies in production
5. **Organization Isolation**: Users are associated with organizations to maintain data isolation

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:
   - Ensure the redirect URI in Okta exactly matches the one configured in Web Starter
   - Check for trailing slashes or protocol differences (http vs https)

2. **"Organization not found" error**:
   - Verify the organization slug is correct
   - Ensure the organization has been created in the admin panel

3. **"Okta not configured" error**:
   - Check that Okta configuration has been saved for the organization
   - Ensure Okta is activated (not just configured)

4. **Session issues**:
   - Verify that cookies are enabled in the browser
   - Check that the session secret is properly configured

## Development Setup

1. Copy `.env.example` to `.env`
2. Ensure `AUTH0_SECRET` is set (used for session encryption)
3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

1. Set all required environment variables
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Ensure HTTPS is configured
4. Set secure session cookie settings in production

## Future Enhancements

This is a stub implementation that provides basic Okta OAuth functionality. Potential enhancements include:

- Role-based access control (RBAC) using Okta groups
- Just-in-time (JIT) user provisioning
- SAML support in addition to OAuth
- Automated Okta app configuration via API
- Multiple identity providers per organization
- User directory sync
- Advanced session management
- Audit logging for authentication events