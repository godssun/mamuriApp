#!/usr/bin/env bash
# backup.sh — PostgreSQL 일일 백업 스크립트
#
# Docker 컨테이너 안의 PostgreSQL에서 pg_dump를 실행하고
# 로컬 backups/ 디렉토리에 날짜별로 저장한다.
# 7일 초과 백업 파일은 자동 정리.
#
# Usage:
#   ./backup.sh                    # 기본 백업
#   ./backup.sh --keep-days 14     # 14일 보관
#
# Cron 예시 (매일 새벽 3시):
#   0 3 * * * /opt/mamuri/deploy/scripts/backup.sh >> /opt/mamuri/backups/cron.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

# .env.production 로드 (cron 환경에서도 환경변수 사용 가능)
ENV_FILE="$PROJECT_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# 기본 설정
KEEP_DAYS=7
CONTAINER_NAME="mamuri-postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mamuri_${TIMESTAMP}.sql.gz"

# 인자 파싱
for arg in "$@"; do
    case "$arg" in
        --keep-days)
            shift
            KEEP_DAYS="${1:-7}"
            shift
            ;;
    esac
done

echo "============================================"
echo "  Mamuri PostgreSQL Backup"
echo "============================================"
echo "  Time:      $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "  Container: $CONTAINER_NAME"
echo "  Output:    $BACKUP_FILE"
echo "  Retention: ${KEEP_DAYS} days"
echo "============================================"

# ---- Step 1: 백업 디렉토리 확인 ----
mkdir -p "$BACKUP_DIR"

# ---- Step 2: 컨테이너 실행 확인 ----
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[backup] ERROR: Container '$CONTAINER_NAME' is not running."
    exit 1
fi

# ---- Step 3: pg_dump 실행 ----
echo ""
echo "[backup] Running pg_dump..."

docker exec "$CONTAINER_NAME" pg_dump \
    -U "${DB_USERNAME:-mamuri}" \
    -d "${POSTGRES_DB:-mamuri}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_FILE"

# 파일 크기 확인
FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "[backup] Backup created: $BACKUP_FILE ($FILE_SIZE)"

# ---- Step 4: 백업 검증 ----
if [ ! -s "$BACKUP_FILE" ]; then
    echo "[backup] ERROR: Backup file is empty. Something went wrong."
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo "[backup] Backup verified (non-empty)."

# ---- Step 5: 오래된 백업 정리 ----
echo ""
echo "[backup] Cleaning backups older than ${KEEP_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name "mamuri_*.sql.gz" -mtime +${KEEP_DAYS} -print -delete | wc -l)
echo "[backup] Deleted ${DELETED} old backup(s)."

# ---- 완료 ----
REMAINING=$(find "$BACKUP_DIR" -name "mamuri_*.sql.gz" | wc -l)
echo ""
echo "============================================"
echo "  Backup complete!"
echo "  File: $BACKUP_FILE"
echo "  Size: $FILE_SIZE"
echo "  Total backups: ${REMAINING}"
echo "============================================"
