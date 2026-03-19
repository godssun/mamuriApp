#!/usr/bin/env bash
# restore.sh — PostgreSQL 백업 복원 스크립트
#
# 지정된 백업 파일을 Docker PostgreSQL 컨테이너에 복원한다.
#
# Usage:
#   ./restore.sh backups/mamuri_20260319_030000.sql.gz
#
# 주의:
#   - 이 스크립트는 기존 데이터를 덮어씁니다
#   - 복원 전 현재 상태를 자동으로 백업합니다
#   - 복원 중에는 백엔드 컨테이너를 중지해야 합니다

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"
CONTAINER_NAME="mamuri-postgres"

# .env.production 로드
ENV_FILE="$PROJECT_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

if [ $# -eq 0 ]; then
    echo "Usage: ./restore.sh <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "$PROJECT_DIR/backups/mamuri_"*.sql.gz 2>/dev/null || echo "  (none found)"
    exit 1
fi

BACKUP_FILE="$1"

# 상대 경로 → 절대 경로
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="$PROJECT_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[restore] ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "============================================"
echo "  Mamuri PostgreSQL Restore"
echo "============================================"
echo "  Time:      $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "  Container: $CONTAINER_NAME"
echo "  Source:    $BACKUP_FILE"
echo "============================================"
echo ""
echo "  WARNING: 이 작업은 기존 데이터를 덮어씁니다."
echo "  복원 전 현재 상태를 자동으로 백업합니다."
echo ""
read -p "  계속하시겠습니까? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "[restore] Cancelled."
    exit 0
fi

# ---- Step 1: 컨테이너 확인 ----
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[restore] ERROR: Container '$CONTAINER_NAME' is not running."
    exit 1
fi

# ---- Step 2: 현재 상태 백업 ----
echo ""
echo "[restore] Creating safety backup of current state..."
"$SCRIPT_DIR/backup.sh" || {
    echo "[restore] WARNING: Safety backup failed. Proceeding anyway."
}

# ---- Step 3: 복원 실행 ----
echo ""
echo "[restore] Restoring from: $BACKUP_FILE"

gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql \
    -U "${DB_USERNAME:-mamuri}" \
    -d "${POSTGRES_DB:-mamuri}" \
    --quiet \
    --single-transaction

echo "[restore] Restore completed."

# ---- 완료 ----
echo ""
echo "============================================"
echo "  Restore complete!"
echo "  Source: $(basename "$BACKUP_FILE")"
echo ""
echo "  다음 단계:"
echo "  1. 백엔드 컨테이너를 재시작하세요"
echo "  2. 데이터가 정상인지 확인하세요"
echo "============================================"
