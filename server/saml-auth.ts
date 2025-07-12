import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import type { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';
import session from 'express-session';

const prisma = new PrismaClient();

interface SamlProfile {
  email?: string;
  nameID: string;
  nameIDFormat: string;
  issuer: string;
  displayName?: string;
  givenName?: string;
  [key: string]: any;
}

interface AuthenticatedRequest extends Request {
  user?: any;
  organizationId?: string;
}

export function configureSamlAuth(app: Express) {
  // Configure session for SAML
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

export async function createSamlStrategy(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization || !organization.samlEnabled) {
    throw new Error('SAML not enabled for this organization');
  }

  return new SamlStrategy(
    {
      entryPoint: organization.samlEntryPoint!,
      issuer: organization.samlIssuer!,
      cert: organization.samlCert!,
      callbackUrl: `${process.env.AUTH0_BASE_URL}/api/saml/callback/${organizationId}`,
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    },
    async (profile: any, done: any) => {
      try {
        // Extract email from SAML profile
        const email = profile.email || profile.nameID;
        
        if (!email) {
          return done(new Error('No email found in SAML profile'));
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // Create user if doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              auth0Id: `saml|${profile.nameID}`,
              name: profile.displayName || profile.givenName || email,
            },
          });
        }

        // Check if user is already a team member
        let teamMember = await prisma.teamMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId,
            },
          },
        });

        // Add user to organization if not already a member
        if (!teamMember) {
          teamMember = await prisma.teamMember.create({
            data: {
              userId: user.id,
              organizationId,
              role: 'MEMBER',
            },
          });
        }

        return done(null, {
          ...user,
          organizationId,
          teamMemberId: teamMember.id,
          role: teamMember.role,
        });
      } catch (error) {
        return done(error);
      }
    }
  );
}

export function samlAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const organizationId = req.params.organizationId || req.query.organizationId as string;
  
  if (organizationId) {
    req.organizationId = organizationId;
  }
  
  next();
}

export async function handleSamlLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const strategy = await createSamlStrategy(organizationId);
    passport.use(`saml-${organizationId}`, strategy);
    
    passport.authenticate(`saml-${organizationId}`)(req, res, next);
  } catch (error) {
    console.error('SAML login error:', error);
    res.status(500).json({ error: 'SAML authentication failed' });
  }
}

export async function handleSamlCallback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    passport.authenticate(`saml-${organizationId}`, {
      successRedirect: '/dashboard',
      failureRedirect: '/login?error=saml_failed',
    })(req, res, next);
  } catch (error) {
    console.error('SAML callback error:', error);
    res.status(500).json({ error: 'SAML callback failed' });
  }
}