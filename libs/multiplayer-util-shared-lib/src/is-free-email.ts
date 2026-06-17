import freeEmailDomain from 'free-email-domains'

export default (email: string): boolean => {
  const [,domain] = email.split('@')
  return freeEmailDomain.includes(domain)
}
