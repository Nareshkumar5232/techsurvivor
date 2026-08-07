import type { ProfileInputParsed } from "@tech-survivor/shared";
import type { UserProfile } from "@tech-survivor/types";
import {
  createUser,
  findByEventRegistrationId,
  findByRollNumber,
  getUserById,
  updateUser,
} from "../repositories/userRepo.js";
import { AppError } from "../lib/errors.js";
import type { AuthenticatedUser } from "../types/express.js";

async function assertUniqueIdentifiers(
  input: ProfileInputParsed,
  excludeUid?: string,
): Promise<void> {
  const existingByRoll = await findByRollNumber(input.rollNumber);
  if (existingByRoll && existingByRoll.uid !== excludeUid) {
    throw new AppError("VALIDATION_ERROR", "This roll number is already registered", {
      field: "rollNumber",
    });
  }

  if (input.eventRegistrationId) {
    const existingByRegId = await findByEventRegistrationId(input.eventRegistrationId);
    if (existingByRegId && existingByRegId.uid !== excludeUid) {
      throw new AppError("VALIDATION_ERROR", "This event registration ID is already used", {
        field: "eventRegistrationId",
      });
    }
  }
}

export async function createProfile(
  authUser: AuthenticatedUser,
  input: ProfileInputParsed,
): Promise<UserProfile> {
  const existing = await getUserById(authUser.uid);
  if (existing?.profileComplete) {
    throw new AppError("CONFLICT", "Profile already completed. Use PATCH /api/profile to update it.");
  }

  await assertUniqueIdentifiers(input, authUser.uid);

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: authUser.uid,
    role: "participant",
    fullName: input.fullName,
    email: authUser.email,
    emailVerified: authUser.emailVerified,
    institution: input.institution,
    department: input.department,
    year: input.year,
    rollNumber: input.rollNumber,
    phone: input.phone,
    eventRegistrationId: input.eventRegistrationId ?? null,
    profileComplete: true,
    status: "active",
    disqualified: false,
    disqualificationReason: null,
    createdAt: now,
    updatedAt: now,
  };

  await createUser(profile);
  return profile;
}

export async function patchProfile(
  authUser: AuthenticatedUser,
  input: Partial<ProfileInputParsed>,
): Promise<UserProfile> {
  const existing = await getUserById(authUser.uid);
  if (!existing) throw new AppError("NOT_FOUND", "Profile not found");

  if (input.rollNumber || input.eventRegistrationId) {
    await assertUniqueIdentifiers(
      {
        rollNumber: input.rollNumber ?? existing.rollNumber,
        eventRegistrationId: input.eventRegistrationId ?? existing.eventRegistrationId ?? undefined,
        fullName: existing.fullName,
        institution: existing.institution,
        department: existing.department,
        year: existing.year,
        phone: existing.phone,
      },
      authUser.uid,
    );
  }

  await updateUser(authUser.uid, input);
  const updated = await getUserById(authUser.uid);
  if (!updated) throw new AppError("INTERNAL_ERROR", "Failed to load updated profile");
  return updated;
}
