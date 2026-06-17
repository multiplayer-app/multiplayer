#!/usr/bin/env bash
# shellcheck disable=SC2155 disable=SC1090
set -e

SERVICE_NAME_ORIGINAL=$(basename "${PWD}")

SERVICE_NAME="${SERVICE_NAME_ORIGINAL/multiplayer-/}"
SERVICE_NAME="${SERVICE_NAME/-service/}"

RELEASE_NOTES="[GitHub commit: ${COMMIT_SHORT_SHA}](${REPOSITORY_URL}/commit/${COMMIT_SHA}) / [GitHub branch: ${BRANCH_NAME}](${REPOSITORY_URL}/compare/${BRANCH_NAME})"

echo "SERVICE_NAME=$SERVICE_NAME"

SPACE_ID=$(curl --silent -H "X-Octopus-ApiKey:$OCTOPUS_API_KEY" -H "Content-Type:application/json" "$OCTOPUS_HOST/api/spaces/all?partialName=$OCTOPUS_SPACE" | jq -r -c '.[].Id')
echo "SPACE_ID=$SPACE_ID"

PROJECT_ID=$(curl --silent -H "X-Octopus-ApiKey:$OCTOPUS_API_KEY" -H "Content-Type:application/json" "$OCTOPUS_HOST/api/projects/$SERVICE_NAME" | jq -r -c '.Id')
echo "PROJECT_ID=$PROJECT_ID"

BODY='{"ProjectId":"'$PROJECT_ID'","SpaceId": "'$SPACE_ID'","Version":"'$SERVICE_VERSION'","ReleaseNotes": "'$RELEASE_NOTES'"}'
echo "BODY=$BODY"

curl -X POST --write-out %{http_code} --silent --output /dev/null -H "X-Octopus-ApiKey:$OCTOPUS_API_KEY" -H "Content-Type:application/json" -d "$BODY" "$OCTOPUS_HOST/api/releases"
