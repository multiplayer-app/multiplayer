import sgMail from '@sendgrid/mail'
import { FROM_EMAIL, SENDGRID_API_KEY } from '../config'

sgMail.setApiKey(SENDGRID_API_KEY)

export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  sendAt?: Date | string | number,
) => {
  const params = {
    to: email,
    from: FROM_EMAIL,
    subject,
    html: body,
    ...sendAt
      ? {
        send_at: sendAt instanceof Date
          ? Math.floor(sendAt.getTime() / 1000)
          : Math.floor(new Date(sendAt as string).getTime() / 1000),
      }
      : {},
  }

  return sgMail.send(params)
}
