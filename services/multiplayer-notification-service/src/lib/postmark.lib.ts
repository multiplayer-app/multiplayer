import { ServerClient } from 'postmark'
import { FROM_EMAIL, POSTMARK_API_TOKEN } from '../config'

const postmarkClient = new ServerClient(POSTMARK_API_TOKEN)

export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  sendAt?,
) => {
  const params = {
    From: FROM_EMAIL,
    To: email,
    Subject: subject,
    HtmlBody: body,
  }

  return postmarkClient.sendEmail(params)
}
