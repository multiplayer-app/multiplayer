#!/usr/bin/env bash
# shellcheck disable=SC2155 disable=SC1090

SERVICE_NAME_ORIGINAL=$(basename "${PWD}")
SERVICE_NAME="${SERVICE_NAME_ORIGINAL/multiplayer-/}"
SERVICE_NAME="${SERVICE_NAME/-service/}"

RELEASE_NOTES="[GitHub commit: ${COMMIT_SHORT_SHA}](${REPOSITORY_URL}/commit/${COMMIT_SHA}) / [GitHub branch: ${BRANCH_NAME}](${REPOSITORY_URL}/compare/${BRANCH_NAME})"

multiplayer releases create \
  --api-key="$MULTIPLAYER_API_KEY" \
  --service="$SERVICE_NAME" \
  --repository-url="$REPOSITORY_URL" \
  --commit-hash="$COMMIT_SHA" \
  --release-version="$SERVICE_VERSION" \
  --release-notes="$RELEASE_NOTES"
