#!/usr/bin/env bash
# rollback.sh — Rollback to the previous Blue-Green deployment
#
# Flow:
#   1. Detect current active color
#   2. Start the other (previous) container
#   3. Health check previous container
#   4. Switch nginx upstream back
#   5. Reload nginx
#   6. Stop current (bad) container
#
# Usage:
#   ./rollback.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
UPSTREAM_FILE="$DEPLOY_DIR/nginx/upstream.conf"

# docker-compose v1 or docker compose v2 — auto-detect
if command -v docker-compose &>/dev/null; then
    DC="docker-compose"
elif docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
else
    echo "[rollback] ERROR: Neither docker-compose nor docker compose found."
    exit 1
fi

# ---- Step 1: Detect current active color ----
if grep -q "mamuri-blue" "$UPSTREAM_FILE" 2>/dev/null; then
    CURRENT="blue"
    ROLLBACK_TO="green"
elif grep -q "mamuri-green" "$UPSTREAM_FILE" 2>/dev/null; then
    CURRENT="green"
    ROLLBACK_TO="blue"
else
    echo "[rollback] ERROR: Cannot determine active container from upstream.conf"
    exit 1
fi

CURRENT_CONTAINER="mamuri-$CURRENT"
ROLLBACK_CONTAINER="mamuri-$ROLLBACK_TO"

echo "============================================"
echo "  Mamuri Rollback"
echo "============================================"
echo "  Using:          $DC"
echo "  Current (bad):  $CURRENT ($CURRENT_CONTAINER)"
echo "  Rolling back to: $ROLLBACK_TO ($ROLLBACK_CONTAINER)"
echo "============================================"

# ---- Step 2: Start rollback container ----
echo ""
echo "[rollback] Starting $ROLLBACK_CONTAINER..."
$DC -f "$COMPOSE_FILE" up -d "backend-$ROLLBACK_TO"

# ---- Step 3: Health check ----
echo ""
if ! "$SCRIPT_DIR/health-check.sh" "$ROLLBACK_CONTAINER" 20; then
    echo ""
    echo "[rollback] FAILED: $ROLLBACK_CONTAINER is not healthy either."
    echo "[rollback] Manual intervention required."
    echo "[rollback] $CURRENT_CONTAINER is still active."
    exit 1
fi

# ---- Step 4: Switch upstream ----
echo ""
echo "[rollback] Switching nginx upstream to $ROLLBACK_CONTAINER..."

cat > "$UPSTREAM_FILE" <<EOF
# Active upstream — rolled back by rollback.sh at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Rolled back from: $CURRENT
upstream backend {
    server $ROLLBACK_CONTAINER:8080;
}
EOF

# ---- Step 5: Reload nginx ----
echo "[rollback] Reloading nginx..."
docker exec mamuri-nginx nginx -s reload

echo "[rollback] Traffic now routed to $ROLLBACK_CONTAINER"

# ---- Step 6: Stop bad container ----
echo ""
echo "[rollback] Stopping $CURRENT_CONTAINER..."
$DC -f "$COMPOSE_FILE" stop "backend-$CURRENT"

echo ""
echo "============================================"
echo "  Rollback complete!"
echo "  Active: $ROLLBACK_TO ($ROLLBACK_CONTAINER)"
echo "============================================"
