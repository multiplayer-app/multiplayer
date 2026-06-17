#!/usr/bin/env bash
# shellcheck disable=SC2155 disable=SC1090
set -E -e -o pipefail -o errtrace -o errexit

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

for SERVICE_FOLDER_PATH in services/*/ cronjobs/*/; do
  SERVICE_FOLDER_PATH="${SERVICE_FOLDER_PATH%/}"
  SERVICE_FOLDER_NAME=$(basename "$SERVICE_FOLDER_PATH")


  [ -f "${SERVICE_FOLDER_PATH}/Dockerfile" ] || continue
  [ -f "${SERVICE_FOLDER_PATH}/package.json" ] || continue

  # PACKAGE_NAME=$(node -p "require('./${SERVICE_FOLDER_PATH}/package.json').name")

  SERVICE_NAME="${SERVICE_FOLDER_NAME/multiplayer-/}"
  SERVICE_NAME="${SERVICE_NAME/-service/}"
  SERVICE_NAME=${DOCKER_REPOSITORY_PREFIX}${SERVICE_NAME}

  echo "Building Docker image ${DOCKER_IMAGE_REGISTRY}/${SERVICE_NAME}:${VERSION}"

  docker build\
    --platform linux/amd64 \
    -t $DOCKER_IMAGE_REGISTRY/$SERVICE_NAME:$VERSION \
    --build-arg SERVICE_FOLDER=${SERVICE_FOLDER_PATH} \
    --build-arg NODE_ENV=${NODE_ENV} \
    --build-arg VERSION=${VERSION} \
    -f  ${SERVICE_FOLDER_PATH}/Dockerfile .

done
