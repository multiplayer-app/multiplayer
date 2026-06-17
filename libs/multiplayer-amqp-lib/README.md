# Multiplayer amqp library

- [Environment variables](#environment-variables)
  - [AMQP_RPC_TIMEOUT](#amqprpctimeout)
  - [AMQP_RECONNECT_INTERVAL](#amqp_reconnect_interval)
  - [AMQP_RECONNECT_MAX_OFFSET](#amqp_rreconnect_max_offset)
  - [AMQP_URI](#amqpuri)
- [`AMQP.connect()`](#amqpconnect)
- [`AMQP.disconnect()`](#amqpdisconnect)
- [`AMQP.listen()`](#amqplisten)
- [`AMQP.request()`](#amqprequest)
- [`AMQP.publish()`](#amqppublish)
- [`AMQP.ping()`](#amqpping)
- [`AMQP.bindQueue()`](#amqpbindqueue)
- [Error handling](#error-handling)

## Environment variables:

### AMQP_RPC_TIMEOUT
Timeout in milliseconds during which RPC response should be received. Default `5000` ms.

### AMQP_RECONNECT_INTERVAL
Reconnect interal to rabbit mq in milliseconds. Default is `500` ms.

### AMQP_RECONNECT_MAX_OFFSET
Absolute max offset value which applied during calculating reconnect delay. Can't be more than `AMQP_RECONNECT_INTERVAL`. Default is `500` ms.

### AMQP_URI
Url for connecting to rabbit mq. Example: `amqp://guest:guest@localhost:5672`.
Default: `amqp://localhost:5672`

### AMQP_RECONNECT_MAX_OFFSET
Max offset in milliseconds which can be used between reconnects to amqp.

#### `AMQP.connect()`

Note: if connection string not passed to connect function, `AMQP_URI` env variable will be used for connecting.

```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')

```

#### `AMQP.disconnect()`
```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')


await AMQP.disconnect()
```

#### `AMQP.listen()`

Note: default options for listen function are:
```
{
  durable: false,
  prefetch: undefined // not set
}
```

```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')

const listener = async (message) => {
  ...
}
const queueName = 'example-queue'
const options = { durable: true, prefetch: 2 }

await AMQP.listen(queueName, listener, options)
```

#### `AMQP.request()`

Note: Default timeout for RPC response defined at `AMQP_RPC_TIMEOUT` env variable.

```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')

const queueName = 'example-queue'
const data = { action: 'GET_SOME_DATA' }
const options = { timeout: 4000 }

const response = await AMQP.request(queueName, data, options)
```

#### `AMQP.publish()`

```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')

const queueName = 'example-queue'
const data = { action: 'PUBLISH_SOME_DATA' }
const options = { durable: true }

await AMQP.publish(queueName, data, options)
```

#### `AMQP.ping()`

```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')

const isConnected = AMQP.ping() // true or false
```

### `AMQP.bindQueue()`

```javascript
const AMQP = require('@multiplayer/amqp')

await AMQP.connect('amqp://guest:guest@localhost:5672')

const AMQP_EXCHANGE_EVENTS_QUEUE='event-exchange-queue'
const AMQP_CONSUME_QUEUE='consume-queue'

const bindOptions = { durable: true }

AMQP.bindQueue(
  AMQP_CONSUME_QUEUE,
  AMQP_EXCHANGE_EVENTS_QUEUE,
  bindOptions
)

const listener = async (message) => {
  // ...
}

const listenOptions = { durable: true, prefetch: 2 }

await AMQP.listen(AMQP_CONSUME_QUEUE, listener, options)

// ...

const data = { action: 'PUBLISH_SOME_DATA' }
const options = { durable: true, fanout: true }

await AMQP.publish(AMQP_EXCHANGE_EVENTS_QUEUE, data, options)
```

#### Error handling
Errors thrown by listener function - catched and sent back to requester (if it was RPC request) in `errors` propery. Type of `errors` is Array<Error>

Example:
```
{
  trace: {...},
  errors: [{
    message: 'Some error message',
    stack: '{{STACK}}',
    service: '{{SERVICE}}',
    name: '{{NAME_OF_ERROR}}',
    status: {{ERROR_STATUS_CODE}}
  }]
}
```
