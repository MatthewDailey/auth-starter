# Web Starter with Auth0 and PostgreSQL

This web starter app has been updated with Auth0 authentication and PostgreSQL database integration.

## Features

- Auth0 authentication (login/logout)
- PostgreSQL database with Prisma ORM
- User profile storage in database
- Logged-in and logged-out page states
- Docker Compose for local PostgreSQL development
- Tailwind CSS for modern, responsive styling

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Auth0 account (free tier works)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Auth0

1. Create an Auth0 account at https://auth0.com
2. Create a new "Regular Web Application"
3. Configure the application settings:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Save your credentials from the Settings tab

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update with your Auth0 credentials:
- `AUTH0_ISSUER_BASE_URL`: Your Auth0 domain (e.g., `https://your-tenant.auth0.com`)
- `AUTH0_CLIENT_ID`: Your application's Client ID
- `AUTH0_CLIENT_SECRET`: Your application's Client Secret
- `AUTH0_SECRET`: Generate with `openssl rand -hex 32`

### 4. Start PostgreSQL Database

```bash
npm run db:up
```

This starts a PostgreSQL container using Docker Compose.

### 5. Run Database Migrations

```bash
npm run db:migrate
```

This creates the User table in your database.

### 6. Start the Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the app.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run db:up` - Start PostgreSQL container
- `npm run db:down` - Stop PostgreSQL container
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run check` - TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Application Flow

1. **Logged Out State**: Users see a welcome page with a "Log In with Auth0" button
2. **Login**: Clicking login redirects to Auth0's universal login page
3. **Callback**: After successful login, Auth0 redirects back to the app
4. **User Creation**: On first login, a user record is created in PostgreSQL
5. **Logged In State**: Users see their profile information and a logout button
6. **Logout**: Clicking logout clears the session and redirects to the logged-out page

## Database Schema

The app creates a `User` table with:
- `id`: UUID primary key
- `auth0Id`: Unique Auth0 user ID
- `email`: User's email address
- `name`: User's display name (optional)
- `picture`: Profile picture URL (optional)
- `createdAt`: Timestamp of user creation
- `updatedAt`: Timestamp of last update

## API Endpoints

- `GET /api/ping` - Health check endpoint
- `GET /api/auth/login` - Initiates Auth0 login flow
- `GET /api/auth/logout` - Logs out the user
- `GET /api/auth/callback` - Auth0 callback endpoint
- `GET /api/auth/me` - Returns current user info or authentication status

## Production Deployment

For production deployment:
1. Update Auth0 application URLs to match your production domain
2. Set proper environment variables in your hosting platform
3. Use a managed PostgreSQL database service
4. Run `npm run build` and deploy the `dist` folder

## Troubleshooting

- **Database Connection Issues**: Ensure Docker is running and port 5432 is not in use
- **Auth0 Errors**: Double-check your Auth0 configuration and environment variables
- **Migration Errors**: Make sure the database container is fully started before running migrations