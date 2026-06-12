#!/bin/sh
set -e

# Inject runtime config into env.js based on container env vars.
cat > /srv/env.js <<EOF
window.__env = {
  apiUrl: "${API_URL:-}",
  keycloak: {
    url: "${KEYCLOAK_URL:-}",
    realm: "${KEYCLOAK_REALM:-chatims-app}",
    clientId: "${KEYCLOAK_CLIENT_ID:-chatims-client}"
  }
};
EOF

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
