#!/usr/bin/env bash
# health-check.sh — Check if a backend container is healthy
# Usage: ./health-check.sh <container_name> [max_attempts]
#
# 1차: Docker healthcheck 상태 확인
# 2차: Docker healthcheck가 없으면 직접 HTTP 요청으로 확인

set -euo pipefail

CONTAINER="$1"
MAX_ATTEMPTS="${2:-30}"
INTERVAL=3

echo "[health-check] Waiting for $CONTAINER to become healthy..."

# Docker healthcheck가 설정되어 있는지 확인
HAS_HEALTHCHECK=$(docker inspect --format='{{if .State.Health}}true{{else}}false{{end}}' "$CONTAINER" 2>/dev/null || echo "false")

for i in $(seq 1 "$MAX_ATTEMPTS"); do
    if [ "$HAS_HEALTHCHECK" = "true" ]; then
        # Docker healthcheck 상태 확인
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "not_found")

        if [ "$STATUS" = "healthy" ]; then
            echo "[health-check] $CONTAINER is healthy (attempt $i/$MAX_ATTEMPTS)"
            exit 0
        fi

        echo "[health-check] $CONTAINER status: $STATUS (attempt $i/$MAX_ATTEMPTS)"
    else
        # Docker healthcheck 없으면 직접 HTTP 확인
        HTTP_CODE=$(docker exec "$CONTAINER" wget -qO- -S http://localhost:8080/actuator/health 2>&1 | head -1 || echo "000")

        if docker exec "$CONTAINER" wget -qO- http://localhost:8080/actuator/health >/dev/null 2>&1; then
            echo "[health-check] $CONTAINER is healthy via HTTP (attempt $i/$MAX_ATTEMPTS)"
            exit 0
        fi

        echo "[health-check] $CONTAINER HTTP check failed (attempt $i/$MAX_ATTEMPTS)"
    fi

    sleep "$INTERVAL"
done

echo "[health-check] $CONTAINER failed to become healthy after $MAX_ATTEMPTS attempts"

# 실패 시 마지막 로그 출력 (디버깅 용도)
echo "[health-check] Last 10 lines of container logs:"
docker logs --tail 10 "$CONTAINER" 2>&1 || true

exit 1
