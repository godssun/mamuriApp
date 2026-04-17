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

# Create uploads directory with correct ownership before switching to unprivileged user
RUN mkdir -p /app/uploads/avatars && chown -R app:app /app
USER app

EXPOSE 8080

# JVM tuning for 2GB Lightsail (container memory limit: 768M)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65.0 \
  -XX:+UseG1GC \
  -XX:+UseStringDeduplication \
  -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]