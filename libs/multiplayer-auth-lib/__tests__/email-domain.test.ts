import { isAllowed } from '../src/helpers/email-domain.helper'

describe('EmailDomainHelper.isAllowed', () => {
  it('allows any email when no domains are configured', () => {
    expect(isAllowed('john@gmail.com', [])).toBe(true)
  })

  it('matches domain exactly and case-insensitively', () => {
    expect(isAllowed('john@acme.com', ['acme.com'])).toBe(true)
    expect(isAllowed('John@ACME.com', ['acme.com'])).toBe(true)
    expect(isAllowed('john@acme.io', ['acme.com', 'acme.io'])).toBe(true)
  })

  it('rejects other domains, subdomains and lookalikes', () => {
    expect(isAllowed('john@gmail.com', ['acme.com'])).toBe(false)
    expect(isAllowed('john@eng.acme.com', ['acme.com'])).toBe(false)
    expect(isAllowed('john@notacme.com', ['acme.com'])).toBe(false)
    expect(isAllowed('john@acme.com.evil.io', ['acme.com'])).toBe(false)
    expect(isAllowed('john@acme.com@evil.io', ['acme.com'])).toBe(false)
  })

  it('rejects missing or malformed emails when restricted', () => {
    expect(isAllowed(undefined, ['acme.com'])).toBe(false)
    expect(isAllowed('', ['acme.com'])).toBe(false)
    expect(isAllowed('acme.com', ['acme.com'])).toBe(false)
  })
})
