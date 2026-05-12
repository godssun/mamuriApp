# ---- Build Stage ----
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app

# Copy gradle wrapper and build files first (layer caching)
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle/ gradle/

# Download dependencies (cached unless build files change)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# Copy source code
COPY src/ src/

# Build the application
RUN ./gradlew bootJar --no-daemon -x test

# ---- Runtime Stage ----
FROM eclipse-temurin:17-jre-jammy

# (1) user + upload 디렉토리를 한 레이어에 묶는다.
# 이 시점에는 /app에 jar가 없으므로 chown 비용이 거의 0이다.
RUN groupadd -r app \
    && useradd -r -g app app \
    && mkdir -p /app/uploads/avatars /app/uploads/diary-photos \
    && chown -R app:app /app

WORKDIR /app

# (2) JAR을 처음부터 app 소유로 복사한다 — 이후 별도 chown 레이어 없음.
# 기존엔 COPY 후 chown -R /app 으로 인해 133MB jar가 새 레이어에 다시 기록되었다.
COPY --from=builder --chown=app:app /app/build/libs/*.jar app.jar

# (3) entrypoint 복사 + 실행권한을 한 번에 (BuildKit --chmod 필요).
# 기존의 별도 `RUN chmod +x` 레이어를 제거한다.
COPY --chown=app:app --chmod=755 entrypoint.sh /app/entrypoint.sh

EXPOSE 8080

# JVM tuning for 2GB Lightsail (container memory limit: 768M)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65.0 \
  -XX:+UseG1GC \
  -XX:+UseStringDeduplication \
  -Djava.security.egd=file:/dev/./urandom"

# Entrypoint runs as root: fixes volume permissions, then drops to app user
ENTRYPOINT ["/app/entrypoint.sh"]
