import { Producer, ProducerConfig } from 'kafkajs'
import { kafka } from './kafka'

export class KafkaProducer {
  private producer: Producer
  private _isConnected = false
  constructor(config: ProducerConfig = {}) {
    this.producer = kafka.producer(config)
  }

  public async connect() {
    try {
      await this.producer.connect()
      this._isConnected = true
    } catch (err) {
      this._isConnected = false
      throw err
    }
  }

  public isConnected() {
    return this._isConnected
  }

  public async disconnect() {
    await this.producer.disconnect()
    this._isConnected = false
  }

  public async send(topic: string, value: Record<string, any>, key?: string) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(value),
          },
        ],
      })
      this._isConnected = true
    } catch (err) {
      this._isConnected = false
      throw err
    }
  }
}
