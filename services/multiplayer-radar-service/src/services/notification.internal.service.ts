import { SendNotificationMessage } from '@multiplayer/types'
import { AbstractService } from './abstract.service'
import { INTERNAL_API_SERVICE_URI } from '../config'

export class InternalNotificationService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_API_SERVICE_URI
  }

  async sendNotification(variables: SendNotificationMessage['variables']): Promise<void> {
    return this.instance.post('/notifications', variables)
  }
}
