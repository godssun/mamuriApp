# Recommended .gitignore Blocks

Add these blocks if missing.

## Build Artifacts
build/
target/
dist/
.gradle/
node_modules/

## IDE / OS
.idea/
.vscode/
.DS_Store
*.log
.cache/

## Secrets
.env*
*.pem
*.key
.p8
credentials
token
secret

## Language / Framework Specific
*.class
*.jar
*.war
coverage/

## Rule
If a file is environment-specific, it should be ignored by default.