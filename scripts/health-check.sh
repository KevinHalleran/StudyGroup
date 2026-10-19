#!/usr/bin/env bash
# Post-deployment health check. Usage: scripts/health-check.sh <hostname> [attempts] [delay-seconds]
# Verifies the site root and the API health endpoint, retrying while a new deployment propagates.
set -u

host="${1:?usage: health-check.sh <hostname> [attempts] [delay-seconds]}"
attempts="${2:-20}"
delay="${3:-15}"
body="$(mktemp)"
trap 'rm -f "$body"' EXIT

for attempt in $(seq 1 "$attempts"); do
  site_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://${host}/" || true)"
  api_code="$(curl -s -o "$body" -w '%{http_code}' --max-time 20 "https://${host}/api/health" || true)"

  if [ "$site_code" = "200" ] && [ "$api_code" = "200" ] && grep -q '"status":"ok"' "$body"; then
    echo "Healthy after ${attempt} attempt(s): site=${site_code} api=${api_code}"
    cat "$body"; echo
    exit 0
  fi

  echo "Attempt ${attempt}/${attempts}: site=${site_code:-none} api=${api_code:-none}; retrying in ${delay}s"
  sleep "$delay"
done

echo "Health check failed for https://${host}" >&2
exit 1
