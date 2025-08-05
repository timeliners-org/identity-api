// src/routes/auth/schemas.ts
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const LoginSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  password: z.string().min(1, 'Password is required')
})

export const ResendVerificationSchema = z.object({
  email: z.email('Invalid email address')
})

export const VerifyEmailQuerySchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const GetUserIdSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required')
})

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export const RevokeTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export const GroupMemberSchema = z.object({
  group: z.string().min(1, 'Group name is required')
})

export const UserGroupSchema = z.object({
  id: z.string().min(1, 'User ID is required')
})

export const CreateUserSchema = z.object({
  email: z.email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const GetUserByIdParamsSchema = z.object({
  id: z.uuid('Invalid user ID')
})

// Helper function for validation errors
export const formatValidationErrors = (errors: z.core.$ZodIssue[]) => {
  return errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}
