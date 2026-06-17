#!/usr/bin/env bash
set -E -e -o pipefail -o errtrace -o errexit

SERVICE_NAME_ORIGINAL=$(basename "${PWD}")

SERVICE_NAME="${SERVICE_NAME_ORIGINAL/multiplayer-/}"
SERVICE_NAME="${SERVICE_NAME/-service/}"
SERVICE_NAME=${DOCKER_REPOSITORY_PREFIX}${SERVICE_NAME}

echo "Pushing Docker image ${DOCKER_IMAGE_REGISTRY}/${SERVICE_NAME}"
docker push $DOCKER_IMAGE_REGISTRY/$SERVICE_NAME --all-tags

# Clean up the local image after successful push to free disk space
echo "Cleaning up local image ${DOCKER_IMAGE_REGISTRY}/${SERVICE_NAME}:${VERSION}"
docker rmi -f $DOCKER_IMAGE_REGISTRY/$SERVICE_NAME:$VERSION || true
docker buildx prune -f