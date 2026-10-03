const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  // Admin cannot be self-assigned; the first registered user becomes admin automatically.
  role: z.enum(['analyst', 'viewer']).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

const updateRoleSchema = z.object({ role: z.enum(['admin', 'analyst', 'viewer']) });

module.exports = { registerSchema, loginSchema, updateRoleSchema };
