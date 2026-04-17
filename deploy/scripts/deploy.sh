#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
UPSTREAM_FILE="$DEPLOY_DIR/nginx/upstream.conf"
ENV_FILE="$PROJECT_DIR/.env.production"
NETWORK_NAME="deploy_mamuri-net"
FIREBASE_SECRET="$PROJECT_DIR/secrets/firebase-service-account.json"

SKIP_BUILD=false
KEEP_OLD=false

# Jenkins 등 외부에서 주입 가능
IMAGE_NAME="${IMAGE_OVERRIDE:-mamuri-backend:latest}"

for arg in "$@"; do
    case "$arg" in
        --no-build) SKIP_BUILD=true ;;
        --keep-old) KEEP_OLD=true ;;
    esac
done

detect_active_color() {
    if grep -q "mamuri-blue" "$UPSTREAM_FILE" 2>/dev/null; then
        echo "blue"
    elif grep -q "mamuri-green" "$UPSTREAM_FILE" 2>/dev/null; then
        echo "green"
    else
        echo "blue"
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
echo "  Active:    $ACTIVE ($ACTIVE_CONTAINER)"
echo "  Deploying: $INACTIVE ($INACTIVE_CONTAINER)"
echo "  Image:     $IMAGE_NAME"
echo "============================================"

if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "[deploy] Building Docker image..."
    docker build -t "$IMAGE_NAME" "$PROJECT_DIR"
    echo "[deploy] Build complete."
else
    echo ""
    echo "[deploy] Skipping build (--no-build)"
fi

echo ""
echo "[deploy] Ensuring upload volume permissions..."
docker run --rm -u root -v uploads:/app/uploads "$IMAGE_NAME" \
    sh -c 'mkdir -p /app/uploads/avatars /app/uploads/diary-photos && chown -R app:app /app/uploads'

echo ""
echo "[deploy] Starting $INACTIVE_CONTAINER..."

docker rm -f "$INACTIVE_CONTAINER" 2>/dev/null || true

POSTGRES_DB=$(grep '^POSTGRES_DB=' "$ENV_FILE" | cut -d'=' -f2)

VOLUME_ARGS="-v uploads:/app/uploads"
if [ -f "$FIREBASE_SECRET" ]; then
    VOLUME_ARGS="$VOLUME_ARGS -v $FIREBASE_SECRET:/app/secrets/firebase-service-account.json:ro"
fi

docker run -d \
    --name "$INACTIVE_CONTAINER" \
    --network "$NETWORK_NAME" \
    --env-file "$ENV_FILE" \
    -e SPRING_PROFILES_ACTIVE=prod \
    -e "DATABASE_URL=jdbc:postgresql://mamuri-postgres:5432/${POSTGRES_DB}" \
    $VOLUME_ARGS \
    --memory=768m \
    --restart unless-stopped \
    "$IMAGE_NAME"

echo "[deploy] $INACTIVE_CONTAINER started."

echo ""
echo "[deploy] Waiting for $INACTIVE_CONTAINER to be healthy..."

MAX_RETRIES=20
RETRY_INTERVAL=3
for i in $(seq 1 $MAX_RETRIES); do
    if docker exec "$INACTIVE_CONTAINER" wget -qO- http://localhost:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then
        echo "[deploy] $INACTIVE_CONTAINER is healthy! (attempt $i/$MAX_RETRIES)"
        break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo "[deploy] FAILED: $INACTIVE_CONTAINER is not healthy after $MAX_RETRIES attempts."
        echo "[deploy] Logs:"
        docker logs "$INACTIVE_CONTAINER" --tail 20
        echo "[deploy] Stopping failed container..."
        docker rm -f "$INACTIVE_CONTAINER"
        echo "[deploy] Deployment aborted. $ACTIVE_CONTAINER is still active."
        exit 1
    fi
    echo "[deploy] Waiting... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

echo ""
echo "[deploy] Switching nginx upstream to $INACTIVE_CONTAINER..."

cat > "$UPSTREAM_FILE" <<EOF
# Active upstream — switched by deploy.sh at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Previous active: $ACTIVE
upstream backend {
    server $INACTIVE_CONTAINER:8080;
}
EOF

echo "[deploy] Reloading nginx..."
docker exec mamuri-nginx nginx -s reload

echo "[deploy] Traffic now routed to $INACTIVE_CONTAINER"

if [ "$KEEP_OLD" = false ]; then
    echo ""
    echo "[deploy] Stopping old container $ACTIVE_CONTAINER..."
    docker rm -f "$ACTIVE_CONTAINER" 2>/dev/null || true
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