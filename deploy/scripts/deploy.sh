#!/usr/bin/env bash
# deploy.sh — Blue-Green deployment for Mamuri backend
#
# Flow:
#   1. Detect current active color (blue or green)
#   2. Build new Docker image
#   3. Start inactive container with new image
#   4. Health check inactive container
#   5. Switch nginx upstream to inactive container
#   6. Reload nginx (zero downtime)
#   7. Stop old container
#
# Usage:
#   ./deploy.sh              # Auto-detect and deploy
#   ./deploy.sh --no-build   # Skip Docker build (use existing image)
#   ./deploy.sh --keep-old   # Don't stop the old container after switch

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
UPSTREAM_FILE="$DEPLOY_DIR/nginx/upstream.conf"

# docker-compose v1 or docker compose v2 — auto-detect
if command -v docker-compose &>/dev/null; then
    DC="docker-compose"
elif docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
else
    echo "[deploy] ERROR: Neither docker-compose nor docker compose found."
    exit 1
fi

SKIP_BUILD=false
KEEP_OLD=false

for arg in "$@"; do
    case "$arg" in
        --no-build) SKIP_BUILD=true ;;
        --keep-old) KEEP_OLD=true ;;
    esac
done

# ---- Step 1: Detect active color ----
detect_active_color() {
    if grep -q "mamuri-blue" "$UPSTREAM_FILE" 2>/dev/null; then
        echo "blue"
    elif grep -q "mamuri-green" "$UPSTREAM_FILE" 2>/dev/null; then
        echo "green"
    else
        echo "blue"  # default: assume blue is active on first deploy
    fi
}

ACTIVE=$(detect_active_color)
if [ "$ACTIVE" = "blue" ]; then
    INACTIVE="green"
else
    INACTIVE="blue"
fi

ACTIVE_CONTAINER="mamuri-$ACTIVE"
INACTIVE_CONTAINER="mamuri-$INACTIVE"

echo "============================================"
echo "  Mamuri Blue-Green Deployment"
echo "============================================"
echo "  Using:     $DC"
echo "  Active:    $ACTIVE ($ACTIVE_CONTAINER)"
echo "  Deploying: $INACTIVE ($INACTIVE_CONTAINER)"
echo "============================================"

# ---- Step 2: Build Docker image ----
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "[deploy] Building Docker image..."
    docker build -t mamuri-backend:latest "$PROJECT_DIR"
    echo "[deploy] Build complete."
else
    echo ""
    echo "[deploy] Skipping build (--no-build)"
fi

# ---- Step 3: Start inactive container ----
echo ""
echo "[deploy] Starting $INACTIVE_CONTAINER..."
$DC -f "$COMPOSE_FILE" up -d "backend-$INACTIVE"

# ---- Step 4: Health check ----
echo ""
if ! "$SCRIPT_DIR/health-check.sh" "$INACTIVE_CONTAINER" 20; then
    echo ""
    echo "[deploy] FAILED: $INACTIVE_CONTAINER is not healthy. Aborting deployment."
    echo "[deploy] Stopping failed container..."
    $DC -f "$COMPOSE_FILE" stop "backend-$INACTIVE"
    echo "[deploy] Deployment aborted. $ACTIVE_CONTAINER is still active."
    exit 1
fi

# ---- Step 5: Switch nginx upstream ----
echo ""
echo "[deploy] Switching nginx upstream to $INACTIVE_CONTAINER..."

cat > "$UPSTREAM_FILE" <<EOF
# Active upstream — switched by deploy.sh at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Previous active: $ACTIVE
upstream backend {
    server $INACTIVE_CONTAINER:8080;
}
EOF

# ---- Step 6: Reload nginx ----
echo "[deploy] Reloading nginx..."
docker exec mamuri-nginx nginx -s reload

echo "[deploy] Traffic now routed to $INACTIVE_CONTAINER"

# ---- Step 7: Stop old container ----
if [ "$KEEP_OLD" = false ]; then
    echo ""
    echo "[deploy] Stopping old container $ACTIVE_CONTAINER..."
    $DC -f "$COMPOSE_FILE" stop "backend-$ACTIVE"
    echo "[deploy] $ACTIVE_CONTAINER stopped."
else
    echo ""
    echo "[deploy] Keeping old container $ACTIVE_CONTAINER running (--keep-old)"
fi

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "  Active: $INACTIVE ($INACTIVE_CONTAINER)"
echo "============================================"
