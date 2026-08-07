import type { Role, RoundConfig, UserProfile } from "@tech-survivor/types";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      profile?: UserProfile;
      round?: RoundConfig;
    }
  }
}

export {};
