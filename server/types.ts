import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oktaState?: string;
    organizationId?: string;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      picture?: string | null;
      organizationId?: string | null;
    };
  }
}