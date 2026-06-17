#!/usr/bin/env bash
# shellcheck disable=SC2155 disable=SC1090
set -e

if [ -f ".env" ]; then
  set -a
  source .env set
  set +a
fi

docker-compose -f ./docker/docker-compose.dev.yml up -d

turbo build --filter="./libs/*" --filter="./services/*"

# run migrations
npm run migrate:up

# seed necessary data
npm run seed-roles

pm2 start pm2.config.yml --update-env
