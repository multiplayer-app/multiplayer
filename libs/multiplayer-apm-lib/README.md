# APM lib

## Variables

| Variable name                           | Description                                       | Required | Default                                       |
|-----------------------------------------|---------------------------------------------------|----------|-----------------------------------------------|
| `PLATFORM_ENV`                          | Environment type                                  |   ✘      |                                               |
| `NODE_ENV`                              | node environment                                  |   ✘      |                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`    | OTEL endpoint for exporting traces                |   ✘      |                                               |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`      | OTEL endpoint for exporting logs                  |   ✘      |                                               |
| `OTEL_ENABLED`                          | Enable metrics                                    |   ✘      |                                               |
| `OTEL_LOG_LEVEL`                        | NONE, ERROR, WARN, INFO, ALL, DEBUG, VERBOSE      |   ✘      |                                               |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_MP` |                                                   |   ✘      |                                               |
| `VERSION`                               | Service version. Defaults to pkg version          |   ✘      |                                               |
| `SCHEMIFY_REQUEST_RESPONSE_PAYLOAD`     | Do schemification data in span                     |   ✘      | `false`                                       |
| `SEND_REQUEST_RESPONSE_PAYLOAD`         | Send request/response body payload                |   ✘      | `true`                                        |
| `MAX_REQUEST_RESPONSE_SIZE`             | Max size of request response payload              |   ✘      | `500000`                                      |
| `OTEL_IGNORE_OUTGOING_REQUEST_DOMAINS`  | Comma separated domains. `collector.newrelic.com` |   ✘      | ``                                            |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`   | OTEL endpoint for exporting metrics               |   ✘      | `/metrics`                                    |
| `OTLP_METRICS_ENABLED`                  |                                                   |   ✘      | `false`                                       |
| `OTEL_EXPORTER_OTLP_METRICS_PORT`       |                                                   |   ✘      | `9464`                                        |

## Setup for newrelic

environment variables

```
OTEL_EXPORTER_OTLP_HEADERS=api-key={{NR_LICENSE_KEY}}
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://otlp.nr-data.net:4317
```

## Setup multiple opentelemtry trace exporters
```
OTEL_EXPORTER_OTLP_HEADERS_1=api-key={{NR_LICENSE_KEY}}
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_1=https://otlp.nr-data.net:4317

OTEL_EXPORTER_OTLP_HEADERS_2=api-key={{NR_LICENSE_KEY}}
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_2=https://otlp.nr-data.net:4317

OTEL_EXPORTER_OTLP_HEADERS_{{NUMBER}}=api-key={{NR_LICENSE_KEY}}
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_{{NUMBER}}=https://otlp.nr-data.net:4317
```
