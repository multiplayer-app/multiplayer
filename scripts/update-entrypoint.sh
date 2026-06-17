#!/usr/bin/env bash

cat <<< $(jq '.main = "src/index.ts"' package.json) > package.json
