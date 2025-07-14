# WorkOS Setup Guide

This guide will help you set up WorkOS authentication for the Web Starter application.

## Prerequisites

- A WorkOS account (sign up at [workos.com](https://workos.com))
- WorkOS API key and Client ID

## Setup Steps

### 1. Create a WorkOS Account

1. Go to [workos.com](https://workos.com) and sign up for an account
2. Navigate to your WorkOS dashboard

### 2. Configure Your Application

1. In the WorkOS dashboard, go to "Configuration" > "Redirects"
2. Add your redirect URI:
   - For development: `http://localhost:3000/api/auth/callback`
   - For production: `https://your-domain.com/api/auth/callback`

### 3. Get Your Credentials

1. Go to "API Keys" in the WorkOS dashboard
2. Copy your API Key
3. Go to "Configuration" and copy your Client ID

### 4. Configure Environment Variables

Update your `.env` file with the WorkOS credentials:

```env
# WorkOS
WORKOS_API_KEY='your_workos_api_key'
WORKOS_CLIENT_ID='your_workos_client_id'
WORKOS_REDIRECT_URI='http://localhost:3000/api/auth/callback'
WORKOS_SESSION_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
```

### 5. Database Setup

The application uses PostgreSQL with Prisma ORM. The User model has been updated to use `workosId` instead of `auth0Id`.

To set up the database:
```bash
# Start the database
npm run db:up

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 6. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Authentication Flow

1. User clicks "Log In with WorkOS"
2. User is redirected to WorkOS authentication
3. After successful authentication, user is redirected back to `/api/auth/callback`
4. The application creates a session and stores user information
5. User is redirected to the home page

## API Endpoints

- `GET /api/auth/login` - Initiates WorkOS authentication
- `GET /api/auth/callback` - Handles WorkOS callback
- `POST /api/auth/logout` - Logs out the user
- `GET /api/auth/me` - Returns current user information

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**: Make sure the redirect URI in your `.env` file matches exactly what you configured in WorkOS dashboard
2. **Missing session**: Ensure `WORKOS_SESSION_SECRET` is set and the session middleware is properly configured
3. **Database connection issues**: Check that PostgreSQL is running and `DATABASE_URL` is correct