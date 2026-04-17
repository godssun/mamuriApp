#!/bin/sh
# Ensure upload directories exist with correct ownership on every start.
# Named volumes may retain root ownership from previous deployments.
mkdir -p /app/uploads/avatars /app/uploads/diary-photos
chown -R app:app /app/uploads

# Drop to app user and run.
# Use JAVA_HOME absolute path because su resets PATH and loses /opt/java/openjdk/bin.
JAVA_BIN="${JAVA_HOME:-/opt/java/openjdk}/bin/java"
exec su -s /bin/sh app -c "$JAVA_BIN $JAVA_OPTS -jar /app/app.jar"
