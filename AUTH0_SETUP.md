# Auth0 Setup Instructions

Follow these steps to configure Auth0 for this application:

## 1. Create an Auth0 Account
- Go to https://auth0.com and sign up for a free account

## 2. Create a New Application
- In your Auth0 dashboard, go to Applications
- Click "Create Application"
- Choose "Regular Web Applications"
- Name it (e.g., "Web Starter App")

## 3. Configure Application Settings
In your application settings, configure:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000
```

**Allowed Web Origins:**
```
http://localhost:3000
```

## 4. Get Your Credentials
From the Settings tab, copy:
- Domain (e.g., `your-tenant.auth0.com`)
- Client ID
- Client Secret

## 5. Update Your .env File
Copy `.env.example` to `.env` and update with your Auth0 credentials:
```bash
cp .env.example .env
```

Then edit `.env` with your values:
- `AUTH0_ISSUER_BASE_URL` = https://[YOUR-DOMAIN]
- `AUTH0_CLIENT_ID` = [YOUR-CLIENT-ID]
- `AUTH0_CLIENT_SECRET` = [YOUR-CLIENT-SECRET]
- `AUTH0_SECRET` = Generate with: `openssl rand -hex 32`

## 6. For Production
When deploying, update the URLs in Auth0 to match your production domain.