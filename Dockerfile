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

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

# Create upload directories and set base ownership
RUN mkdir -p /app/uploads/avatars /app/uploads/diary-photos \
    && chown -R app:app /app

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080

# JVM tuning for 2GB Lightsail (container memory limit: 768M)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65.0 \
  -XX:+UseG1GC \
  -XX:+UseStringDeduplication \
  -Djava.security.egd=file:/dev/./urandom"

# Entrypoint runs as root: fixes volume permissions, then drops to app user
ENTRYPOINT ["/app/entrypoint.sh"]
