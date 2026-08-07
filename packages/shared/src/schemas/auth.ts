import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    institution: z.string().trim().min(2).max(160),
    department: z.string().trim().min(1).max(120),
    year: z.string().trim().min(1).max(20),
    rollNumber: z.string().trim().min(1).max(60),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),
    eventRegistrationId: z.string().trim().max(60).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
