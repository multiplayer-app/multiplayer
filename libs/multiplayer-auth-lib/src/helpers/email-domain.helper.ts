import { ALLOWED_EMAIL_DOMAINS } from '../config'

export const isAllowed = (
  email: string | undefined | null,
  allowedDomains: string[] = ALLOWED_EMAIL_DOMAINS,
): boolean => {
  if (!allowedDomains.length) {
    return true
  }

  const atIndex = email?.lastIndexOf('@') ?? -1

  if (!email || atIndex < 0) {
    return false
  }

  const domain = email.slice(atIndex + 1).trim().toLowerCase()

  return allowedDomains.includes(domain)
}
