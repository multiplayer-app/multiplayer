// import AMQP from '@multiplayer/amqp'
// import { SendEmailMessage } from '@multiplayer/types'
// import { AMQP_NOTIFICATION_QUEUE } from '../config'

// const addDays = (date: Date, days: number) => {
//   date.setDate(date.getDate() + days)
//   return date
// }

export const sendOnboardingEmails = async (user: any) => {
  // const now = new Date()

  // await Promise.all([
  //   AMQP.publish(
  //     AMQP_NOTIFICATION_QUEUE,
  //     {
  //       variables: {
  //         template: 'ONBOARDING_1',
  //         email: user?.profiles?.local?.email,
  //         sendAt: addDays(now, 3),
  //         data: {
  //           user,
  //         },
  //       },
  //     } as SendEmailMessage,
  //   ),
  //   AMQP.publish(
  //     AMQP_NOTIFICATION_QUEUE,
  //     {
  //       variables: {
  //         template: 'ONBOARDING_2',
  //         email: user?.profiles?.local?.email,
  //         sendAt: addDays(now, 6),
  //         data: {
  //           user,
  //         },
  //       },
  //     } as SendEmailMessage,
  //   ),
  //   AMQP.publish(
  //     AMQP_NOTIFICATION_QUEUE,
  //     {
  //       variables: {
  //         template: 'ONBOARDING_3',
  //         email: user?.profiles?.local?.email,
  //         sendAt: addDays(now, 9),
  //         data: {
  //           user,
  //         },
  //       },
  //     } as SendEmailMessage,
  //   ),
  // ])
}
