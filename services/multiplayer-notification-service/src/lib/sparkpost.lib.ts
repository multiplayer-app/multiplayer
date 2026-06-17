import SparkPost from 'sparkpost'
import { FROM_EMAIL, SPARKPOST_API_TOKEN } from '../config'

const client = new SparkPost(SPARKPOST_API_TOKEN)

const toIsoString = (date: Date) => {
  const tzo = -date.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function(num) {
      return (num < 10 ? '0' : '') + num
    }

  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      dif + pad(Math.floor(Math.abs(tzo) / 60)) +
      ':' + pad(Math.abs(tzo) % 60)
}

export const sendEmail = async (
  email: string,
  subject: string,
  body: string,
  sendAt?: Date | string,
) => {
  const params = {
    content: {
      from: FROM_EMAIL,
      subject,
      html: body,
    },
    recipients: [
      { address: { email } },
    ],
    ...sendAt ?
      {
        options: {
          start_time: sendAt instanceof Date
            ? toIsoString(sendAt)
            : toIsoString(new Date(sendAt)),
        },
      }
      : {},
  }

  return client.transmissions.send(params)
}
