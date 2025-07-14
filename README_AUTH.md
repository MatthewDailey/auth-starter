# Web Starter with WorkOS and PostgreSQL

This web starter app has been updated with WorkOS authentication and PostgreSQL database integration.

## Features

- WorkOS authentication (login/logout)
- PostgreSQL database with Prisma ORM
- User profile storage in database
- Logged-in and logged-out page states
- Docker Compose for local PostgreSQL development
- Tailwind CSS for modern, responsive styling

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- WorkOS account (free tier works)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure WorkOS

1. Create a WorkOS account at https://workos.com
2. In the WorkOS dashboard, configure redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback`
   - For production: `https://your-domain.com/api/auth/callback`
3. Save your API Key and Client ID from the dashboard

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update with your WorkOS credentials:
- `WORKOS_API_KEY`: Your WorkOS API Key
- `WORKOS_CLIENT_ID`: Your WorkOS Client ID
- `WORKOS_REDIRECT_URI`: Your callback URL (e.g., `http://localhost:3000/api/auth/callback`)
- `WORKOS_SESSION_SECRET`: Generate with `openssl rand -hex 32`

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

1. **Logged Out State**: Users see a welcome page with a "Log In with WorkOS" button
2. **Login**: Clicking login redirects to WorkOS authentication
3. **Callback**: After successful login, WorkOS redirects back to the app
4. **User Creation**: On first login, a user record is created in PostgreSQL
5. **Logged In State**: Users see their profile information and a logout button
6. **Logout**: Clicking logout clears the session and redirects to the logged-out page

## Database Schema

The app creates a `User` table with:
- `id`: UUID primary key
- `workosId`: Unique WorkOS user ID
- `email`: User's email address
- `name`: User's display name (optional)
- `picture`: Profile picture URL (optional)
- `createdAt`: Timestamp of user creation
- `updatedAt`: Timestamp of last update

## API Endpoints

- `GET /api/ping` - Health check endpoint
- `GET /api/auth/login` - Initiates WorkOS login flow
- `GET /api/auth/logout` - Logs out the user
- `GET /api/auth/callback` - WorkOS callback endpoint
- `GET /api/auth/me` - Returns current user info or authentication status

## Production Deployment

For production deployment:
1. Update WorkOS redirect URIs to match your production domain
2. Set proper environment variables in your hosting platform
3. Use a managed PostgreSQL database service
4. Run `npm run build` and deploy the `dist` folder

## Troubleshooting

- **Database Connection Issues**: Ensure Docker is running and port 5432 is not in use
- **WorkOS Errors**: Double-check your WorkOS configuration and environment variables
- **Migration Errors**: Make sure the database container is fully started before running migrations
- **Session Issues**: Ensure `WORKOS_SESSION_SECRET` is set and sessions are properly configured