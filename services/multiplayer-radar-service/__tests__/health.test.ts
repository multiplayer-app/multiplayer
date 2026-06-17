import request from 'supertest'
import { app } from '../src/app'
import { API_PREFIX } from '../src/config'

describe.skip('GET /healthz', () => {
  test('should return 200', async () => {
    await request(app)
      .get(`${API_PREFIX}/healthz`)
      .set('Accept', 'text/html; charset=UTF-8')
      .expect('Content-Type', /text/)
      .expect('Content-Length', '2')
      .expect(200)
  })
})
