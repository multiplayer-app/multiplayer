#!/usr/bin/env bash

docker-compose down

pm2 delete pm2.config.yml
