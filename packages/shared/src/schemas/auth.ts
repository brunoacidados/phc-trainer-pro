/** Contratos de autenticação (JWT access + refresh com rotação). */
import { z } from "zod";

export const roleSchema = z.enum(["student", "trainer", "admin"]);
export type UserRole = z.infer<typeof roleSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  teamId: z.string().nullable(),
  emailVerified: z.boolean().default(false),
  deactivated: z.boolean().default(false),
  group: z.string().default(""),
  createdAt: z.string(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  /** alternativa ao cookie httpOnly (apps cross-origin) */
  refreshToken: z.string().min(20).optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: publicUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const meResponseSchema = z.object({
  user: publicUserSchema,
  team: z
    .object({
      id: z.string(),
      name: z.string(),
      inviteCode: z.string().optional(),
      memberCount: z.number(),
    })
    .nullable(),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
});

export const forgotPasswordSchema = z.object({ email: z.email() });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
