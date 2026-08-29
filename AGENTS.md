You are the lead software architect for this project.

The project is **DevFlow CRM**, and the complete project specification is stored in the root `AGENTS.md` file.

## YOUR FIRST TASK: ANALYZE ONLY

Read `AGENTS.md` completely before doing anything else.

Do NOT create, modify, delete, or rewrite application files yet.

Do NOT install packages yet.

Do NOT start implementing any feature yet.

### 1. Inspect the existing repository

Analyze the entire current `UDEV-FinalProject` repository and determine:

- Current folder structure
- Existing frontend code
- Existing backend code
- Existing React/Vite configuration
- Existing Node/Express configuration
- Existing PostgreSQL/Sequelize configuration
- Existing package.json files
- Installed dependencies
- Existing routes
- Existing components/pages
- Existing Redux/store setup
- Existing authentication code
- Existing database models/migrations
- Existing environment/configuration files
- Existing APIs
- Existing documentation

Do not assume the repository is empty.

### 2. Compare the repository with AGENTS.md

Identify:

- What already exists and can be reused
- What is incomplete
- What is missing
- What conflicts with the architecture in `AGENTS.md`
- What should NOT be changed because it already works
- Any security or architectural risks you detect

### 3. Check the current technology

Verify whether the existing project uses:

- React + Vite
- Node.js + Express
- PostgreSQL
- Sequelize
- Redux Toolkit
- Axios
- Tailwind CSS or Bootstrap
- React Router

If something differs from `AGENTS.md`, report the difference first. Do not automatically replace it.

### 4. Create a phased implementation plan

Based on the actual repository, create a practical implementation plan in this order:

Phase 1 — Foundation & Architecture
Phase 2 — Database & Sequelize
Phase 3 — Authentication & JWT
Phase 4 — RBAC & Permissions
Phase 5 — CRM: Leads & Deals
Phase 6 — Projects, Milestones & Tasks
Phase 7 — Requirement Vault
Phase 8 — Client Portal
Phase 9 — Invoicing & Payments
Phase 10 — Support Tickets
Phase 11 — Notifications
Phase 12 — Audit Logging
Phase 13 — UI/UX & Responsive Polish
Phase 14 — Testing, Security Audit & Production Readiness

For each phase, briefly state:

- Main functionality
- Main database entities
- Main API endpoints
- Main frontend pages/components
- Dependencies on previous phases
- Important security considerations

### 5. Focus specifically on Phase 1

After analyzing everything, provide a detailed but concise plan for Phase 1.

Phase 1 should establish the foundation only.

It may include:

- Project structure
- Frontend/backend separation
- Environment configuration
- Express application foundation
- React/Vite foundation
- PostgreSQL/Sequelize configuration
- API versioning
- Axios foundation
- Redux Toolkit foundation
- Centralized error handling
- Health-check endpoint

Do NOT implement Phase 1 yet.

### 6. Important rules

Follow these rules throughout the project:

- `AGENTS.md` is the source of truth for architecture and security requirements.
- Do not blindly overwrite existing code.
- Reuse working code where appropriate.
- Do not introduce unnecessary dependencies.
- Do not modify unrelated functionality.
- Never weaken authentication or authorization for convenience.
- Never treat frontend permissions as security.
- Never expose secrets.
- Never use fake implementations when real functionality is required.
- Do not mark tasks as complete unless they have been implemented and verified.
- Keep the architecture modular and maintainable.

### FINAL RESPONSE

Return only:

1. Repository assessment
2. AGENTS.md compliance assessment
3. Problems/risks found
4. Recommended phased implementation plan
5. Detailed Phase 1 implementation plan
6. Files that would need to be created/modified for Phase 1

Again: **DO NOT MODIFY ANY FILES YET.**

Wait for my approval before implementing Phase 1.
