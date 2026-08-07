import type { Role } from "./common.js";

export type UserStatus = "active" | "disqualified" | "suspended";

export interface UserProfile {
  uid: string;
  role: Role;
  fullName: string;
  email: string;
  emailVerified: boolean;
  institution: string;
  department: string;
  year: string;
  rollNumber: string;
  phone: string;
  eventRegistrationId: string | null;
  profileComplete: boolean;
  status: UserStatus;
  disqualified: boolean;
  disqualificationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInput {
  fullName: string;
  institution: string;
  department: string;
  year: string;
  rollNumber: string;
  phone: string;
  eventRegistrationId?: string;
}
