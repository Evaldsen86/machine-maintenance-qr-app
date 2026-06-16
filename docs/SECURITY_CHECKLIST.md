# Security Checklist — Self-Hosted

## Authentication and authorization
- [ ] Implement real server-side authentication (JWT or httpOnly session cookies)
- [ ] Remove hardcoded credentials and mock auth for production
- [ ] Enforce RBAC/permissions in backend (not only in the UI)
- [ ] Require authentication for all write operations
- [ ] Scope all reads/writes to `company_id` / tenant in backend
- [ ] Protect delete endpoints with authorization + audit logging

## CORS, headers, and network controls
- [ ] Restrict CORS using environment variables (`CORS_ORIGIN`)
- [ ] Nginx sets security headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] TLS only (redirect HTTP → HTTPS)
- [ ] Disable any debug endpoints in production

## Input validation and error handling
- [ ] Validate all API payloads (e.g., Zod/Joi) before using data
- [ ] Ensure errors do not leak stack traces or sensitive internal info
- [ ] Rate-limit auth and other sensitive endpoints (brute-force protection)

## Multi-company (tenant) security
- [ ] Every business table includes `company_id` / tenant_id
- [ ] Add integration tests verifying cross-tenant access is blocked
- [ ] Ensure public QR access is limited to safe fields only

## File storage security
- [ ] Store files outside the web root (or protect via signed URLs)
- [ ] Enforce upload validation (file size, content type)
- [ ] Ensure download permissions are checked server-side
- [ ] Limit storage bucket access policy (MinIO/IAM if used)

## Secrets and operational security
- [ ] Never commit real secrets to git
- [ ] Rotate secrets after deployment
- [ ] Enable logging for admin actions and data mutations
- [ ] Monitor container restarts and disk usage

## Dependency hygiene
- [ ] Keep dependencies updated (regular `npm audit` / SCA)
- [ ] Rebuild images on dependency changes

## QR / Public access model
- [ ] Treat QR public access as untrusted
- [ ] Avoid embedding sensitive data directly in QR payloads
- [ ] Prefer a short slug or machine id + server-side authorization checks

