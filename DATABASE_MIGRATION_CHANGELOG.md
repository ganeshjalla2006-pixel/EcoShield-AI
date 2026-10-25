# EcoShield AI — Database Migration Changelog
**Version:** 5.0.0-hardened  
**Supersedes:** 4.1.0-hardened  
**Date:** October 25, 2026  

---

## Summary of Major Enhancements & Fixes (v4.1.0 -> v5.0.0)

| Area | Version 4.1.0 | Version 5.0.0-hardened | Security Rationale |
| :--- | :--- | :--- | :--- |
| **Deletion Denial & Least Privilege** | `GRANT DELETE` granted on `pollution_reports`, `prevention_tasks`, and `environmental_hotspots`. | Completely revoked `DELETE` on all 5 tables from `PUBLIC`, `anon`, and `authenticated`. Removed DELETE RLS policies. | Zero client DELETE privileges prevents data loss or unauthorized deletion of civic incident reports and prevention tasks. |
| **Prevention Task Dispatch** | Authenticated users could insert tasks via RLS without a dedicated BEFORE INSERT trigger check. | Added `enforce_task_creation_workflow()` trigger enforcing that only municipal administrators can create prevention tasks. | Guarantees prevention tasks cannot be dispatched or initialized in verified state by citizens or rogue field workers. |
| **Environmental Hotspot Hardening** | Inconsistent grants and no dedicated trigger on `environmental_hotspots`. | Revoked all anonymous access; restricted authenticated UPDATE to operational columns; added `enforce_hotspot_workflow()` trigger; removed DELETE privilege. | Restricts hotspot mutation and dispatch strictly to administrators while protecting immutable metadata. |
| **Admin Provisioning Multi-Gate** | Function had basic superuser check. | Added multi-layer gate checking `session_user NOT IN ('postgres', 'supabase_admin')`, `service_role`, `auth.role()`, and `request.jwt.claim.role`. Revoked from `PUBLIC`, `anon`, `authenticated`. | Completely shields `provision_initial_admin()` from client invocation or browser JWT context manipulation. |
| **Profile Protection Trigger** | Checked `CURRENT_USER IN ('postgres', 'supabase_admin')`. | Authorization is enforced natively via PostgreSQL column-level grants (`GRANT UPDATE (display_name, department, avatar_url) ON public.profiles TO authenticated`). `protect_profile_fields` verifies role/deactivation changes require admin. | Eliminates fragile `CURRENT_USER` context assumptions. The PostgreSQL query parser blocks unauthorized column updates before trigger invocation. |
| **Audit Log Anti-Fabrication** | Allowed clients to insert any valid action string if assigned to the task. | Triggers automatically record all lifecycle milestones (`TASK_ASSIGNED`, `TASK_STARTED`, `TASK_COMPLETED`, `RETURNED_FOR_CORRECTION`, `VERIFIED_BY_ADMIN`). Direct client inserts are strictly restricted to operational comments/notes (`COMMENT_ADDED`, `STATUS_UPDATED`, `EVIDENCE_SUBMITTED`). | Prevents rogue field workers or malicious clients from forging administrative sign-offs or false completion records. |
| **Report Verification Rewards** | Only `prevention_tasks` tracked single reward issuance; reports lacked a reward lock. | Added `verification_reward_granted BOOLEAN NOT NULL DEFAULT false` to `public.pollution_reports`. | Prevents duplicate +15 EcoPoints awards on concurrent verification or multiple updates to verified reports. |
| **Supabase Storage Policies** | Storage bucket rules were not included in the database migration. | Added **Section 10**: Idempotent provisioning of the private `report-evidence` bucket (10MB limit, JPEG/PNG/WebP/PDF whitelist) and RLS on `storage.objects` enforcing user folder ownership (`evidence/{user_id}/*`). | Protects uploaded photographic and document evidence from unauthorized access, cross-user tampering, and arbitrary file uploads. |
| **Security Test Harness** | Tests contained an anti-pattern where `EXCEPTION WHEN OTHERS` caught the test block's own failure exception. | Completely redesigned `DATABASE_SECURITY_TESTS.sql` with 17 tests: authentic Supabase 4-variable JWT context simulator (`pg_temp.set_test_jwt`), statement execution separated from assertions, clean transactional rollback. | Ensures tests faithfully simulate Supabase PostgREST client behavior and never produce false-positive passes. |
| **Automated Schema Audit Tests** | Unit tests only tested application mock logic. | Added `tests/databaseSecurityMigration.test.mjs`, bringing total test count to **85 passing tests** (`npm.cmd test`). | Continuously verifies SQL migration integrity, coordinate masking, immutability triggers, and storage policies. |
| **Frontend Type Alignment** | `PollutionReport` interface in `src/types/index.ts` lacked `verificationRewardGranted`. | Added `verificationRewardGranted?: boolean;` to `PollutionReport`. Verified 0 TypeScript errors (`npx.cmd tsc --noEmit`). | Guarantees complete end-to-end schema compatibility between PostgreSQL and frontend services. |

---

## Detailed Section-by-Section Changes in `DATABASE_SCHEMA_FIXED.sql`

### 1. Section 3: Tables & Backfills
- **`public.pollution_reports`**:
  - Added column: `verification_reward_granted BOOLEAN NOT NULL DEFAULT false`.
  - Added backfill: `UPDATE public.pollution_reports SET verification_reward_granted = (status IN ('verified', 'resolved', 'action_taken')) WHERE verification_reward_granted IS NULL;`.

### 2. Section 6: Triggers & Functions
- **`protect_profile_fields()`**:
  - Removed `v_is_db_superuser := (CURRENT_USER IN ('postgres', 'supabase_admin'));`.
  - Replaced with direct role/admin validation (`IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN RAISE EXCEPTION ...`).
  - Added validation that point increments for non-admins match recognized civic workflow amounts (+10, +15, +25).
- **`enforce_report_workflow()`**:
  - Added `verification_reward_granted` guard to prevent duplicate +15 EcoPoints awards to reporters.
- **`enforce_task_workflow()`**:
  - Added automated audit log insertions on task state transitions:
    - `assigned` -> `in_progress`: automatically logs `TASK_STARTED`.
    - `in_progress` -> `completed`: automatically logs `TASK_COMPLETED`.
    - `completed` -> `in_progress` (admin return): automatically logs `RETURNED_FOR_CORRECTION`.
    - `completed` -> `verified` (admin verification): automatically logs `VERIFIED_BY_ADMIN`.
- **`log_task_creation_audit()`**:
  - New trigger function on `public.prevention_tasks`: Automatically logs `TASK_ASSIGNED` upon task creation.
- **`enforce_audit_log_actor()`**:
  - Added anti-fabrication check: Blocks clients from submitting lifecycle actions directly. Direct client inserts are restricted strictly to `COMMENT_ADDED`, `STATUS_UPDATED`, and `EVIDENCE_SUBMITTED`.

### 3. Section 8: Role Grants
- Explicitly set `authenticated` column-level UPDATE grants on `profiles` to `(display_name, department, avatar_url)`.
- Maintained least-privilege view grants (`GRANT SELECT ... TO anon;`) with zero direct table grants to `anon`.

### 4. Section 10: Supabase Storage (New Section)
- Added idempotent creation of `storage.buckets` record for `report-evidence`.
- Added 4 RLS policies on `storage.objects`:
  1. `evidence_authenticated_upload`: User folder isolation (`evidence/{auth.uid()}/*`).
  2. `evidence_owner_read`: Citizen reads own evidence; staff/admin reads all.
  3. `evidence_owner_delete`: Citizen can delete own files while report is submitted.
  4. `evidence_admin_manage`: Full management for administrators.

---

## Deliverables Summary

1. [`DATABASE_SCHEMA_FIXED.sql`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_SCHEMA_FIXED.sql) — Version 5.0.0-hardened
2. [`DATABASE_SECURITY_AUDIT.md`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_SECURITY_AUDIT.md) — Comprehensive vulnerability audit report
3. [`DATABASE_SECURITY_TESTS.sql`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_SECURITY_TESTS.sql) — Corrected 17-test staging test harness with authentic 4-variable Supabase JWT context simulator
4. [`DATABASE_DEPLOYMENT_GUIDE.md`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_DEPLOYMENT_GUIDE.md) — Beginner-friendly deployment and recovery guide with staging-first verification
5. [`DATABASE_PERMISSION_MATRIX.md`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_PERMISSION_MATRIX.md) — Role/table/column permission specification
6. [`DATABASE_MIGRATION_CHANGELOG.md`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_MIGRATION_CHANGELOG.md) — Detailed version diff and architectural notes
7. [`tests/databaseSecurityMigration.test.mjs`](file:///c:/Users/user/OneDrive/Desktop/demo/tests/databaseSecurityMigration.test.mjs) — Automated schema integrity test suite (85/85 passing tests)
