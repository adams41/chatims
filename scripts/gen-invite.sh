#!/usr/bin/env bash
# Generate invite codes for closed beta. Run on a server with docker access.
# Usage: ./scripts/gen-invite.sh 5 "Test cohort A"
#   $1 = how many codes (default 1)
#   $2 = optional note

set -uo pipefail

COUNT="${1:-1}"
NOTE="${2:-}"

for i in $(seq 1 "$COUNT"); do
  CODE="CHAT-$(LC_ALL=C tr -dc 'A-HJ-NP-Z2-9' < /dev/urandom | head -c 6)"
  if [[ -n "$NOTE" ]]; then
    docker exec -i chatims-postgres psql -U "${DB_USERNAME:-chatims}" -d chatims -c \
      "INSERT INTO invite_codes (code, note) VALUES ('$CODE', '$NOTE');" >/dev/null
  else
    docker exec -i chatims-postgres psql -U "${DB_USERNAME:-chatims}" -d chatims -c \
      "INSERT INTO invite_codes (code) VALUES ('$CODE');" >/dev/null
  fi
  echo "$CODE"
done
