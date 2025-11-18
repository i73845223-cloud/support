import { UserRole } from '@prisma/client'
import * as z from 'zod'

export const SettingsSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  birth: z.string()
  .refine((val) => {
    const [day, month, year] = val.split('.');
    const birthDate = new Date(`${year}-${month}-${day}`);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      return false;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age >= 18;
  }, {
    message: "You must be at least 18 years old"
  }),
  email: z.string().email(),
  password: z.string().optional(),
  newPassword: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isTwoFactorEnabled: z.boolean().optional(),
})

    .refine((data) => {
        if (data.password && !data.newPassword) {
            return false
        }

        return true
    }, {
        message: 'New password is required!',
        path: ['newPassword']
    })
    .refine((data) => {
        if (data.newPassword && !data.password) {
            return false
        }

        return true
    }, {
        message: 'Password is required!',
        path: ['password']
    })

export const NewPasswordSchema = z.object({
    password: z.string().min(6, {
        message: 'Minimum of 6 characters required'
    })
})

export const ResetSchema = z.object({
    email: z.string().email({
        message: 'Email is required'
    }),
})

export const LoginSchema = z.object({
    email: z.string().email({
        message: 'Email is required'
    }),
    password: z.string().min(1, {
        message: 'Password is required'
    }),
    code: z.optional(z.string()),
})

export const RegisterSchema = z.object({
    email: z.string().email({
        message: 'Email is required'
    }),
    password: z.string().min(6, {
        message: 'Minimum 6 characters required'
    }),
    name: z.string().min(1, {
        message: 'Name is required'
    })
})