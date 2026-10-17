#!/bin/sh
set -eu
# Only public values are written into the SPA. jq safely escapes JSON strings.
jq -n \
  --arg apiUrl "${PUBLIC_API_URL:?PUBLIC_API_URL is required}" \
  --arg identityUrl "${PUBLIC_IDENTITY_URL:?PUBLIC_IDENTITY_URL is required}" \
  '{apiUrl: $apiUrl, identityUrl: $identityUrl, realm: "mousetrap", clientId: "mousetrap-web"}' \
  > /usr/share/nginx/html/config.json
