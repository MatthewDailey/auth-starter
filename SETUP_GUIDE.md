# Organization & SAML Setup Guide

This guide will walk you through setting up and testing the organization management and Okta SAML integration features.

## Prerequisites

- Node.js 18+ installed
- Docker installed (for PostgreSQL)
- Auth0 account (free tier is fine)
- Okta developer account (free at https://developer.okta.com)

## Step 1: Initial Setup

### 1.1 Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd <repo-directory>

# Install dependencies
npm install
```

### 1.2 Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Database (keep as is for local development)
DATABASE_URL="postgresql://webapp_user:webapp_password@localhost:5432/webapp_db"

# Auth0 Configuration
AUTH0_SECRET='<generate-with: openssl rand -hex 32>'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://<your-auth0-domain>.auth0.com'
AUTH0_CLIENT_ID='<your-auth0-client-id>'
AUTH0_CLIENT_SECRET='<your-auth0-client-secret>'

# Server
PORT=3000
NODE_ENV=development

# Session (for SAML)
SESSION_SECRET='<generate-with: openssl rand -hex 32>'
```

### 1.3 Auth0 Setup

1. Log in to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new application:
   - Name: "Web Starter App"
   - Type: "Regular Web Applications"
3. In the application settings:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Copy the Domain, Client ID, and Client Secret to your `.env` file

### 1.4 Start PostgreSQL

```bash
# Start the database
docker compose up -d postgres

# Wait a few seconds for it to initialize
sleep 5

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Step 2: Start the Application

```bash
# Start the development server
npm run dev
```

Visit http://localhost:3000 and you should see the login page.

## Step 3: Test Basic Authentication

1. Click "Log In with Auth0"
2. Sign up or log in with your Auth0 account
3. You should be redirected back to the app and see the welcome screen
4. Click "View Organizations" in the navigation

## Step 4: Create an Organization

1. Click "Create Organization"
2. Enter:
   - Organization Name: "My Test Company"
   - Organization Slug: "my-test-company" (lowercase, hyphens only)
3. Click "Create"
4. You should see your new organization in the list

## Step 5: Set Up Okta for SAML

### 5.1 Create Okta Developer Account

1. Go to https://developer.okta.com
2. Sign up for a free developer account
3. You'll receive an Okta domain like `dev-12345678.okta.com`

### 5.2 Create SAML Application in Okta

1. Log in to your Okta Admin Dashboard
2. Navigate to **Applications** → **Applications**
3. Click **Create App Integration**
4. Select:
   - Sign-in method: **SAML 2.0**
   - Click **Next**

### 5.3 Configure SAML Settings

**General Settings:**
- App name: "Web Starter SAML"
- App logo: (optional)
- Click **Next**

**SAML Settings:**

First, you need your organization ID from the app:
1. Go back to your app at http://localhost:3000/organizations
2. Click on your organization
3. Copy the ID from the URL (e.g., `http://localhost:3000/organizations/abc-123-def`)

Now in Okta, configure:

- **Single Sign On URL**: `http://localhost:3000/api/saml/callback/<your-org-id>`
- **Audience URI (SP Entity ID)**: `http://localhost:3000/saml/<your-org-id>`
- **Default RelayState**: (leave blank)
- **Name ID format**: EmailAddress
- **Application username**: Email

**Attribute Statements** (optional but recommended):
- Name: `email` → Value: `user.email`
- Name: `firstName` → Value: `user.firstName`
- Name: `lastName` → Value: `user.lastName`

Click **Next**, then **Finish**

### 5.4 Get SAML Configuration from Okta

1. In your newly created Okta app, go to the **Sign On** tab
2. Click **View SAML setup instructions**
3. You'll need:
   - **Identity Provider Single Sign-On URL** (SSO URL)
   - **Identity Provider Issuer** 
   - **X.509 Certificate** (copy the entire certificate including BEGIN/END lines)

## Step 6: Configure SAML in Your Organization

1. Go back to your app at http://localhost:3000
2. Navigate to your organization
3. Click **Configure SAML**
4. Check **Enable SAML Authentication**
5. Fill in:
   - **SAML Entry Point**: The SSO URL from Okta
   - **SAML Issuer**: `http://localhost:3000/saml/<your-org-id>`
   - **SAML Certificate**: Paste the X.509 certificate from Okta
6. Click **Save Configuration**

## Step 7: Assign Users in Okta

1. In Okta Admin, go to your SAML app
2. Click the **Assignments** tab
3. Click **Assign** → **Assign to People**
4. Select your user or create a test user
5. Click **Assign** and **Save and Go Back**

## Step 8: Test SAML Login

### 8.1 Direct SAML Login

1. Copy the SAML login URL shown in your organization (green box)
   - It should look like: `http://localhost:3000/api/saml/login/<your-org-id>`
2. Open a new incognito/private browser window
3. Navigate to the SAML login URL
4. You should be redirected to Okta
5. Log in with the assigned Okta user
6. You should be redirected back and logged in via SAML

### 8.2 Verify SAML User

1. Check the navigation bar - you should see a "SAML" badge next to your name
2. Go to the organization's team members page
3. You should see yourself listed as a member

## Step 9: Test Team Management

### 9.1 Invite a Team Member

1. As the organization owner, click **Invite Member**
2. Enter an email address and select a role (Admin or Member)
3. Click **Send Invite**

**If SAML is enabled:**
- You'll see a message with the SAML login URL
- Share this URL with the invited user
- They can use it to join via Okta

**If SAML is not enabled:**
- The user must first create an account via Auth0
- Then you can add them to the team

### 9.2 Manage Team Roles

1. As an owner or admin, you can change member roles
2. Use the dropdown next to each member
3. Owners cannot be changed or removed

### 9.3 Remove Team Members

1. Click **Remove** next to any non-owner member
2. Confirm the removal

## Step 10: Test Multiple Organizations

1. Create another organization with a different slug
2. Configure different SAML settings (or leave SAML disabled)
3. Verify that:
   - Each organization has separate team members
   - SAML configuration is independent per organization
   - Users can be members of multiple organizations

## Troubleshooting

### Common Issues

1. **SAML Login Fails**
   - Check that the callback URL in Okta matches exactly
   - Ensure the certificate is copied completely
   - Check browser console for errors

2. **Database Connection Errors**
   - Ensure Docker is running: `docker ps`
   - Check PostgreSQL logs: `docker logs webapp_postgres`
   - Restart database: `docker compose restart postgres`

3. **Auth0 Login Issues**
   - Verify callback URLs in Auth0 dashboard
   - Check that all environment variables are set correctly
   - Clear browser cookies and try again

4. **TypeScript Errors**
   - Run `npx prisma generate` after any schema changes
   - Run `npm run check` to see type errors
   - Restart the dev server after installing new packages

### Viewing Logs

```bash
# Application logs
npm run dev

# Database logs
docker logs -f webapp_postgres

# Check database content
docker exec -it webapp_postgres psql -U webapp_user -d webapp_db
\dt  # List tables
SELECT * FROM "User";
SELECT * FROM "Organization";
SELECT * FROM "TeamMember";
```

## Production Considerations

Before deploying to production:

1. **Security**
   - Use HTTPS everywhere (update all URLs)
   - Generate strong secrets for AUTH0_SECRET and SESSION_SECRET
   - Validate SAML certificates properly
   - Implement rate limiting

2. **Database**
   - Use a managed PostgreSQL service
   - Set up proper backups
   - Configure connection pooling

3. **SAML**
   - Validate email domains for organization membership
   - Implement SAML logout
   - Add support for multiple identity providers
   - Consider SAML metadata endpoints

4. **Monitoring**
   - Add error tracking (e.g., Sentry)
   - Monitor authentication failures
   - Track organization and team metrics

## API Reference

### Organization Endpoints

- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/:id` - Get organization details
- `PATCH /api/organizations/:id` - Update organization (owner only)
- `DELETE /api/organizations/:id` - Delete organization (owner only)

### Team Member Endpoints

- `GET /api/organizations/:id/members` - List team members
- `POST /api/organizations/:id/members` - Invite team member
- `PATCH /api/organizations/:id/members/:memberId` - Update member role
- `DELETE /api/organizations/:id/members/:memberId` - Remove member

### SAML Endpoints

- `GET /api/saml/login/:organizationId` - Initiate SAML login
- `POST /api/saml/callback/:organizationId` - SAML assertion callback

## Next Steps

- Implement email invitations for non-SAML organizations
- Add support for multiple SAML providers per organization
- Implement organization-wide settings and permissions
- Add audit logs for organization activities
- Create organization dashboards and analytics