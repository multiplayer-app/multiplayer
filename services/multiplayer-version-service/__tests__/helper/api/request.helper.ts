import { app } from '../../../src/app'
import { API_PREFIX } from '../../../src/config'
import request from 'supertest'
import { ProjectBranchCreateResponse } from '@multiplayer/types'

export class RequestHelper {
  private req
  constructor(app) {
    this.req = request(app)
  }

  private buildParamsString(params: Record<string, any>) {
    return Object.keys(params).map((key) => `${key}=${params[key]}`).join(';')
  }

  private proceedResponse<T>(resp: any) {
    return {
      error: resp.error,
      statusCode: resp.statusCode,
      body: resp.body as T,
    }
  }

  public async get<T>(url: string, params: Record<string, any>, cookie: string) {
    const resp = await this.req
      .get(`${API_PREFIX}${url}?${this.buildParamsString(params)}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
    return this.proceedResponse<T>(resp)
  }

  public async delete<T>(url: string, params: Record<string, any>, cookie: string) {
    const resp = await this.req
      .delete(`${API_PREFIX}${url}?${this.buildParamsString(params)}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
    return this.proceedResponse<T>(resp)
  }

  public async post<T>(url: string, body: object, cookie: string) {
    const resp = await this.req
      .post(`${API_PREFIX}${url}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send(body)
    return this.proceedResponse<T>(resp)
  }
  public async patch<T>(url: string, body: object, cookie: string) {
    const resp = await this.req
      .patch(`${API_PREFIX}${url}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send(body)
    return this.proceedResponse<T>(resp)
  }
}

export const requestHelper = new RequestHelper(app)
