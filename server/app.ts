/**
 * @fileoverview Sets up an Express server with CORS, JSON parsing, and a ping endpoint. Serves either the Vite development server or static production files.
 */

import express from 'express'
import cors from 'cors'
import { createServer as createViteServer } from 'vite'
import dotenv from 'dotenv'
import { sessionMiddleware, getAuthorizationUrl, authenticateWithCode } from './auth'
import type { AuthenticatedRequest } from './auth'
import { prisma } from './prisma'

dotenv.config()

export async function createApp() {
  const app = express()
  const isDev = process.env.NODE_ENV !== 'production'
  console.log('isDev', isDev)

  app.use(sessionMiddleware)
  
  app.use('/api', cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  app.use(express.json())

  app.get('/api/ping', (req, res) => {
    console.log('Received ping.')
    return res.send('pong')
  })

  app.get('/api/auth/me', async (req: AuthenticatedRequest, res) => {
    if (!req.session.user) {
      return res.json({ authenticated: false })
    }

    try {
      let user = await prisma.user.findUnique({
        where: { workosId: req.session.user.id }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            workosId: req.session.user.id,
            email: req.session.user.email,
            name: `${req.session.user.firstName || ''} ${req.session.user.lastName || ''}`.trim() || null,
            picture: null
          }
        })
      }

      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        }
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.get('/api/auth/login', async (req, res) => {
    try {
      const authorizationUrl = await getAuthorizationUrl()
      res.redirect(authorizationUrl)
    } catch (error) {
      console.error('Error getting authorization URL:', error)
      res.status(500).json({ error: 'Failed to initiate login' })
    }
  })

  app.get('/api/auth/callback', async (req: AuthenticatedRequest, res) => {
    const { code } = req.query
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' })
    }

    try {
      const user = await authenticateWithCode(code)
      
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }
      
      res.redirect('/')
    } catch (error) {
      console.error('Error authenticating with code:', error)
      res.status(500).json({ error: 'Authentication failed' })
    }
  })

  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err)
        return res.status(500).json({ error: 'Logout failed' })
      }
      res.json({ success: true })
    })
  })

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
    app.get('*', (req, res, next) => {
      if (!req.url.startsWith('/api')) {
        vite.middlewares(req, res, next)
      } else {
        next()
      }
    })
  } else {
    app.use(express.static('dist'))
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: './dist' })
    })
  }

  return app
}
