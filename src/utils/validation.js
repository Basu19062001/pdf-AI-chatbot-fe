import { z } from 'zod';

export const signupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long.')
    .max(150, 'Full name must be 150 characters or fewer.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[0-9]/, 'Password must include a number.')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character.'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

