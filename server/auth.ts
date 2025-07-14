import { WorkOS } from '@workos-inc/node'
import type { Request, Response, NextFunction } from 'express'
import session from 'express-session'
import dotenv from 'dotenv'

dotenv.config()

export const workos = new WorkOS(process.env.WORKOS_API_KEY!)

export const sessionMiddleware = session({
  secret: process.env.WORKOS_SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
})

export interface AuthenticatedRequest extends Request {
  session: session.Session & {
    user?: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

export const getAuthorizationUrl = async (): Promise<string> => {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId: process.env.WORKOS_CLIENT_ID!,
    redirectUri: process.env.WORKOS_REDIRECT_URI!,
    provider: 'authkit',
  })
  
  return authorizationUrl
}

export const authenticateWithCode = async (code: string) => {
  const { user } = await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID!,
    code,
  })
  
  return user
}