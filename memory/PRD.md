# Kindred Wealth Studio — PRD

## Original Problem Statement
> "build me react application for wealth and asset management react framework should be very light"
> Follow-up: "add Micronaut capability for JWT and backed customer onboard"

## User Choices
- Scope: Frontend-only React (light) + later real backend
- Backend: **Micronaut 4.10 (Java 17)** replacing FastAPI on `0.0.0.0:8001`
- Auth: JWT bearer + bcrypt, roles `ADMIN` / `CUSTOMER`
- Onboarding fields: full name, email, phone, country, date of birth
- Persistence: H2 file-based at `/app/backend/data/kindred.mv.db`
- Portfolio data (assets/tx/goals): still localStorage (out of scope for backend swap)

## Architecture
- **Backend** — Micronaut 4.10.13 (Java 17), Maven build → `target/backend-0.1.jar`
  - `micronaut-data-hibernate-jpa` + Hikari + H2 (file mode, `MODE=LEGACY`)
  - `micronaut-security-jwt` (HS256, 2-hour expiry)
  - `at.favre.lib:bcrypt:0.10.2` for password hashing
  - Endpoints: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/me`, `GET /api/health`, `GET/PATCH /api/customers`, `GET /api/customers/{id}`
  - `AdminSeeder` creates the admin user on first boot
  - Supervisor command: `/usr/bin/java -Dmicronaut.environments=prod -jar /app/backend/target/backend-0.1.jar`
- **Frontend** — React 19 + Tailwind + Shadcn UI + Recharts + Phosphor
  - `lib/api.js` axios client with bearer interceptor
  - `lib/auth.jsx` calls real backend, persists `wm_session` in localStorage
  - 2-step signup (credentials → onboarding fields)
  - Portfolio modules unchanged

## Environment Variables (backend)
- `JWT_SECRET` — HS256 signing secret (set via supervisor)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded admin (default `admin@kindred.local` / `Admin@12345`)
- `H2_FILE` — H2 file path (default `/app/backend/data/kindred`)

## Implementation Status — 2026-04-29
- ✅ Frontend wealth UI (Dashboard, Assets, Transactions, Analytics, Goals)
- ✅ Mock auth (replaced)
- ✅ Micronaut + Maven project under `/app/backend` with all controllers/DTOs/security
- ✅ Admin seeded on boot (idempotent)
- ✅ JWT issuance + role enforcement (ADMIN / CUSTOMER) verified
- ✅ Bcrypt password hashing (cost 12)
- ✅ H2 file DB with Hibernate `hbm2ddl.auto=update`
- ✅ Frontend rewired to real backend, 2-step onboarding
- ✅ Session revalidation via `/api/me` on app load
- ✅ Testing agent: 20/20 backend pytest cases pass, all frontend flows pass

## Backlog
### P1
- Password reset / email verification (token + email link)
- Admin: create/disable/delete customer, assign role
- Refresh tokens (sliding expiry) for longer sessions
- Migrate H2 → Postgres for production deployment
- Move portfolio data (assets/tx/goals) into the backend (CRUD endpoints + per-user scoping)

### P2
- 2FA (TOTP) on admin
- Audit log of admin actions
- KYC fields (address, occupation, source of funds, risk profile, ID upload)
- OpenAPI spec + Swagger UI (Micronaut OpenAPI)
- GraalVM native image for fast cold-start
- Rate limit auth endpoints, account lockout on brute force
- Switch to httpOnly refresh cookies + bearer access tokens

## Operational Notes
- Forked containers may not ship a JRE. If `/api/health` 502s after fork:
  ```
  apt-get install -y openjdk-17-jdk-headless
  sudo supervisorctl restart backend
  ```
- Wipe DB: `rm /app/backend/data/kindred.*` then `sudo supervisorctl restart backend` (admin reseeds).
- Build: `cd /app/backend && mvn -DskipTests -Denforcer.skip=true package`

## Next Tasks
1. Decide: persist portfolio data server-side too (recommended P1).
2. Add password reset + admin user-management screens.
3. Bake JDK into base image for reliable forks (deployment concern).
