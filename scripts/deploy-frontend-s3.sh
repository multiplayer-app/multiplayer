#!/usr/bin/env bash
# shellcheck disable=SC2155 disable=SC1090
set -E -e -o pipefail -o errtrace -o errexit

aws s3 sync ./build s3://${WEB_APP_S3_BUCKET}/${SERVICE_VERSION}/ --delete --acl public-read
