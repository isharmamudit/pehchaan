#!/usr/bin/env bash
# Runs the Supabase CLI with the access token from supabase/.env.cli.
# The token is loaded into the environment and never echoed or passed as an argument.
set -uo pipefail
cd "$(dirname "$0")/.."
if [ -f supabase/.env.cli ]; then
  set -a; . ./supabase/.env.cli; set +a
fi
exec npx -y supabase@latest "$@"
