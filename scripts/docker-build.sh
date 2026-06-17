#!/usr/bin/env bash
# shellcheck disable=SC2155 disable=SC1090
set -E -e -o pipefail -o errtrace -o errexit

SERVICE_NAME_ORIGINAL=$(basename "${PWD}")

SERVICE_NAME="${SERVICE_NAME_ORIGINAL/multiplayer-/}"
SERVICE_NAME="${SERVICE_NAME/-service/}"
SERVICE_NAME=${DOCKER_REPOSITORY_PREFIX}${SERVICE_NAME}

echo "Building Docker image ${DOCKER_IMAGE_REGISTRY}/${SERVICE_NAME}:${VERSION}"

docker build ../../ \
  --platform linux/amd64 \
  -f ./Dockerfile \
  -t $DOCKER_IMAGE_REGISTRY/$SERVICE_NAME:$VERSION \
  --build-arg NODE_ENV=${NODE_ENV} \
  --build-arg VERSION=${VERSION}
  # --cache-from type=local,src=${RUNNER_TEMP}/.buildx-cache-${SERVICE_NAME} \
  # --cache-to type=local,dest=${RUNNER_TEMP}/.buildx-cache-${SERVICE_NAME},mode=max
