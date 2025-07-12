import { User } from '../generated/prisma';

declare global {
  namespace Express {
    interface Request {
      oidc?: any;
      user?: any;
      organizationId?: string;
      isAuthenticated?: () => boolean;
    }
  }
}

export {};