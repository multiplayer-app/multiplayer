#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR%/scripts}"
cd "$PROJECT_ROOT"

OPTIONS=(
  "development|.env"
  "staging|.env.staging"
  "production|.env.production"
)

# Try interactive picker with gum or fzf; fallback to numeric prompt
if command -v gum >/dev/null 2>&1; then
  SELECTED=$(printf "%s\n" "${OPTIONS[@]}" | sed 's/|/\t/' | gum choose --header "Select environment for VS Code bundle" | tr '\t' '|')
elif command -v fzf >/dev/null 2>&1; then
  SELECTED=$(printf "%s\n" "${OPTIONS[@]}" | sed 's/|/\t/' | fzf --prompt="Env > " --header="Select environment for VS Code bundle" | tr '\t' '|')
else
  echo "Select environment for VS Code bundle:"
  echo "  1) development (.env)"
  echo "  2) staging (.env.staging)"
  echo "  3) production (.env.production)"
  read -r -p "Enter choice [1-3]: " env_choice
  case "$env_choice" in
    1) SELECTED="development|.env" ;;
    2) SELECTED="staging|.env.staging" ;;
    3) SELECTED="production|.env.production" ;;
    *) echo "Invalid environment selection" >&2; exit 1 ;;
  esac
fi

ENV_FILE="${SELECTED##*|}"
ENV_NAME="${SELECTED%%|*}"

echo
echo "Building VS Code bundle using $ENV_FILE ..."
npx --no-install env-cmd -f "$ENV_FILE" craco build --config craco.vscode.config.js

echo "Copying build-vscode to VS Code extension media ..."
rm -rf ../../../multiplayer-vscode-extension/media/build-vscode
cp -r ./build-vscode ../../../multiplayer-vscode-extension/media/

echo "Done."
