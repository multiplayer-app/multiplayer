import Mandrill from 'node-mandrill'
import { MANDRILL_API_KEY, FROM_EMAIL } from '../config'

const mandrill = Mandrill(MANDRILL_API_KEY)

const formatDate = (date: Date): string => {
  const pad = (num) => String(num).padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1) // Months are zero-based
  const day = pad(date.getDate())

  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  sendAt?: Date | string | number,
) => {
  const params = {
    message: {
      to: [{ email }],
      from_email: FROM_EMAIL,
      subject,
      html: body,
      ...sendAt
        ? {
          send_at: sendAt instanceof Date
            ? formatDate(sendAt)
            : formatDate(new Date(sendAt as string)),
        }
        : {},
    },
  }

  return mandrill('/messages/send', params)
}
