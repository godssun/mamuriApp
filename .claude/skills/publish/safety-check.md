# Safety Checklist (Publish Skill)

This checklist is evaluated before any commit or push.

## 🚫 NEVER COMMIT
- Secrets or credentials
    - `.env`, `.env.*`
    - `*.pem`, `*.key`, `*.p8`
    - `credentials*`, `secret*`, `token*`
- API keys or OAuth tokens
- Database passwords
- Private certificates

## ⚠️ REQUIRE EXTRA CONFIRMATION
- Configuration files with real endpoints
- Files containing:
    - `PASSWORD=`
    - `SECRET=`
    - `TOKEN=`
    - `PRIVATE_KEY`
- Any file under `resources/` that looks environment-specific

## ✅ SAFE TO COMMIT
- Source code
- Documentation
- Example config files (`*.example`, `*.sample`)
- Docker / CI configuration without secrets

## 🛑 STOP CONDITIONS
If any file is ambiguous:
- STOP immediately
- Ask the user before continuing
- Do not guess or auto-fix

## Final Rule
If unsure → **do not commit**