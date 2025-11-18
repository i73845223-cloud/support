"use server"

import * as z from 'zod'
import bcrypt from 'bcryptjs'

import { db } from '@/lib/db'
import { SettingsSchema } from '@/schemas'
import { getUserByEmail, getUserById } from '@/data/user'
import { currentUser } from '@/lib/auth'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'
import { UserRole } from '@prisma/client'

export const settings = async (
  values: z.infer<typeof SettingsSchema>
) => {
  const user = await currentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const dbUser = await getUserById(user.id)

  if (!dbUser) {
    return { error: 'Unauthorized' }
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email)

    if (existingUser && existingUser.id !== user.id) {
      return { error: 'Email is already in use!' }
    }

    const verificationToken = await generateVerificationToken(values.email)
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.email
    )

    return { success: 'Verification email sent!' }
  }

  let hashedPassword: string | undefined = undefined

  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(values.password, dbUser.password)

    if (!passwordsMatch) {
      return { error: 'Incorrect password!' }
    }

    hashedPassword = await bcrypt.hash(values.newPassword, 10)
  }

  let birthDate: Date | undefined = undefined
  if (values.birth) {
    const [day, month, year] = values.birth.split('.')
    birthDate = new Date(`${year}-${month}-${day}`)
    
    if (isNaN(birthDate.getTime())) {
      return { error: 'Invalid birth date format' }
    }
  }

  try {
    await db.user.update({
      where: { id: dbUser.id },
      data: {
        name: values.name,
        surname: values.surname,
        country: values.country,
        city: values.city,
        isTwoFactorEnabled: values.isTwoFactorEnabled,
        ...(birthDate && { birth: birthDate }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(values.role && { role: values.role as UserRole }),
      },
    })

    return { success: 'Settings Updated!' }
  } catch (error) {
    console.error('Error updating user settings:', error)
    return { error: 'Failed to update settings' }
  }
}