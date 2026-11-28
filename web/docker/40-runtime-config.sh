#!/bin/sh
set -eu
# Only the public Quarkus API URL is exposed to the SPA. Keycloak stays backend-only.
jq -n \
  --arg apiUrl "${PUBLIC_API_URL:?PUBLIC_API_URL is required}" \
  '{apiUrl: $apiUrl}' \
  > /usr/share/nginx/html/config.json
