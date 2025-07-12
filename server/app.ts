/**
 * @fileoverview Sets up an Express server with CORS, JSON parsing, and a ping endpoint. Serves either the Vite development server or static production files.
 */

import express from 'express'
import cors from 'cors'
import { createServer as createViteServer } from 'vite'
import dotenv from 'dotenv'
import { authMiddleware } from './auth'
import { prisma } from './prisma'

dotenv.config()

export async function createApp() {
  const app = express()
  const isDev = process.env.NODE_ENV !== 'production'
  console.log('isDev', isDev)

  app.use(authMiddleware)
  
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

  app.get('/api/auth/me', async (req: any, res) => {
    if (!req.oidc.isAuthenticated()) {
      return res.json({ authenticated: false })
    }

    const auth0User = req.oidc.user
    
    try {
      let user = await prisma.user.findUnique({
        where: { auth0Id: auth0User.sub }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            auth0Id: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture
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
