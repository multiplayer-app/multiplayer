import {
  uniqueNamesGenerator,
  NumberDictionary,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator'
import emailToName from 'email-to-name'

const numberDictionary = NumberDictionary.generate({ length: 3 })

export const generateRandomUsername = (): string => {
  const username = uniqueNamesGenerator({
    dictionaries: [colors, adjectives, animals, numberDictionary],
    length: 4,
    separator: '',
    style: 'capital',
  })

  return username
}

export const getUsernameFromEmail = (email: string): string => {
  const username = email.split('@')[0]

  return username
}

export const getFirstLastNameFromEmail = (email: string): {
  firstName: string,
  lastName: string
} => {
  const extractedString = emailToName.process(email)
  const [
    firstName,
    ...lastName
  ] = extractedString.split(' ')

  return {
    firstName: firstName || '',
    lastName: (lastName || []).join(' '),
  }
}
