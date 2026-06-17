#!/usr/bin/env bash

docker compose --file=./docker-compose-otel.yml --env-file=./scripts/telemetry/.env.telemetry down

pm2 delete pm2.config.yml
