#!/usr/bin/env bash
# Apply the Drizzle-generated SQL migrations to the LOCAL Miniflare D1 store used
# by the Vite dev server. The local D1 lives under .wrangler/ (gitignored) and is
# recreated on a fresh machine, so this script runs on startup to give the dev
# server a schema. It is idempotent: applied migrations are tracked in a
# _dev_migrations table and skipped on subsequent runs.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Reuse the project-local writable HOME / cache sandbox so wrangler and miniflare
# never touch the read-only image home.
if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

root="${SITES_PROJECT_ROOT}"
config="${root}/wrangler.d1.jsonc"
wrangler="${root}/node_modules/.bin/wrangler"
state_dir="${root}/.wrangler/state"

if [[ ! -x "${wrangler}" ]]; then
  echo "[d1] wrangler is unavailable. Run 'npm run install:ci' first." >&2
  exit 69
fi

# Keep wrangler non-interactive and quiet about optional update checks.
export CI=1
export WRANGLER_SEND_METRICS=false

d1_exec() {
  "${wrangler}" d1 execute DB \
    --local \
    --persist-to "${state_dir}" \
    --config "${config}" \
    "$@"
}

applied_count() {
  # Extract the integer from the single-row COUNT(*) result. Wrangler may append
  # an update-available notice, so match only the JSON numeric field.
  d1_exec --json --command "$1" 2>/dev/null \
    | grep -oE '"n": *[0-9]+' \
    | grep -oE '[0-9]+' \
    | head -1
}

d1_exec --command \
  "CREATE TABLE IF NOT EXISTS _dev_migrations (tag TEXT PRIMARY KEY, applied_at TEXT NOT NULL)" \
  >/dev/null

shopt -s nullglob
migrations=("${root}"/drizzle/*.sql)
shopt -u nullglob

if [[ "${#migrations[@]}" -eq 0 ]]; then
  echo "[d1] no migration files found in drizzle/." >&2
  exit 65
fi

for file in "${migrations[@]}"; do
  tag="$(basename "${file}" .sql)"
  count="$(applied_count "SELECT COUNT(*) AS n FROM _dev_migrations WHERE tag = '${tag}'")"
  if [[ "${count:-0}" != "0" ]]; then
    echo "[d1] ${tag} already applied"
    continue
  fi
  echo "[d1] applying ${tag}"
  d1_exec --file "${file}" >/dev/null
  d1_exec --command \
    "INSERT INTO _dev_migrations (tag, applied_at) VALUES ('${tag}', datetime('now'))" \
    >/dev/null
done

echo "[d1] local D1 schema is up to date"
