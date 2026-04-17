#!/bin/sh
# Ensure upload directories exist with correct ownership on every start.
# Named volumes may retain root ownership from previous deployments.
mkdir -p /app/uploads/avatars /app/uploads/diary-photos
chown -R app:app /app/uploads

# Drop to app user and run
exec su -s /bin/sh app -c "java $JAVA_OPTS -jar /app/app.jar"
