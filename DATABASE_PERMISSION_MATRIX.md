# EcoShield AI — Database Security Permission Matrix
**Version:** 5.0.0-hardened  
**Target:** Supabase PostgreSQL 15+  
**Architecture:** Least-Privilege Multi-Layered Defense (Grants + RLS + Triggers)  

---

## 1. Overview of Security Layers

PostgreSQL enforces security in three distinct phases:
1. **Engine-Level Column Privileges (`GRANT`):** Checks whether a role has permission to touch specific columns before query execution. If a column is omitted from `GRANT UPDATE`, PostgreSQL aborts the query immediately with `SQLSTATE 42501 (insufficient_privilege)`.
2. **Row-Level Security (`RLS`):** Filters which rows a role can see (`USING`) or modify (`WITH CHECK`).
3. **Database Triggers (`BEFORE UPDATE/INSERT`):** Validates finite state machine transitions, immutability of historical records, identity binding, and single-reward issuance.

---

## 2. Table-by-Table & Column-by-Column Permission Matrix

### 2.1 Table: `public.profiles`

| Role | Operation | Permitted Columns | Prohibited / Blocked Columns | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`anon`** | SELECT | None | All columns | `REVOKE ALL ON public.profiles FROM anon;` |
| | INSERT / UPDATE / DELETE | None | All columns | Denied at grant level |
| **`citizen`** | SELECT | All columns of own profile (`id = auth.uid()`) | Other users' profiles | RLS `profiles_select_privacy` |
| | INSERT | None (Managed by auth trigger) | All columns | No client INSERT grant |
| | UPDATE | `display_name`, `department`, `avatar_url` | `role`, `eco_points`, `badges`, `reports_submitted`, `tasks_completed`, `is_deactivated`, `email`, `id` | PostgreSQL Column Grant + `protect_profile_fields` Trigger |
| | DELETE | None | All columns | Denied at grant level |
| **`field_worker`** | SELECT | Own profile + profiles of users linked to assigned tasks/reports | Unrelated profiles | RLS `profiles_select_privacy` |
| | UPDATE | `display_name`, `department`, `avatar_url` | Same protected columns as citizen | PostgreSQL Column Grant + `protect_profile_fields` Trigger |
| | DELETE | None | All columns | Denied at grant level |
| **`admin`** | SELECT | Full table access | None | RLS `profiles_select_privacy` |
| | UPDATE | `display_name`, `department`, `avatar_url` (Client); All columns (Direct DB session / RPC) | Immutable `id` and `email` | `protect_profile_fields` Trigger |
| | DELETE | Blocked | All columns | Table-level trigger prevents profile deletion |

---

### 2.2 View: `public.public_profiles` (Public Leaderboard)

| Role | Operation | Permitted Columns | Hidden / Redacted Columns | Security Mode |
| :--- | :--- | :--- | :--- | :--- |
| **`anon` / `authenticated`** | SELECT | `id`, `display_name`, `role`, `avatar_url`, `badges`, `eco_points`, `reports_submitted`, `tasks_completed` | `email`, `department`, `is_deactivated`, `created_at`, `updated_at` | `WITH (security_invoker = false)` owned by `postgres` |
| | INSERT / UPDATE / DELETE | None | All columns | Read-only view (`REVOKE INSERT, UPDATE, DELETE`) |

---

### 2.3 Table: `public.pollution_reports`

| Role | Operation | Permitted Columns | Prohibited / Blocked Columns | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`anon`** | SELECT / INSERT / UPDATE / DELETE | None | All columns | `REVOKE ALL ON public.pollution_reports FROM anon;` |
| **`citizen`** | SELECT | Own reports (any status) + verified/public reports | Private reports submitted by other citizens before verification | RLS `reports_select_authenticated` |
| | INSERT | All report submission fields (`title`, `description`, `lat`, `lng`, `address_name`, `severity`, `category`, `evidence_url`, `evidence_type`, `evidence_notes`, `is_anonymous`, `observed_at`) | `verified_by`, `verification_notes`, `rejection_reason`, `linked_task_id`, `verification_reward_granted`, `status != 'submitted'` | RLS `WITH CHECK (auth.uid() = reporter_id AND status = 'submitted')` |
| | UPDATE | While `status = 'submitted'`: `title`, `description`, `address_name` | `reporter_id`, `reporter_name`, `is_anonymous`, `category`, `severity`, `lat`, `lng`, `evidence_url`, `evidence_type`, `evidence_notes`, `observed_at`, `status`, `assigned_to_id`, `verified_by`, `verification_reward_granted` | `enforce_report_workflow()` Trigger |
| | DELETE | None | All columns | `REVOKE DELETE` + No client DELETE RLS policy |
| **`field_worker`** | SELECT | Assigned reports + reports linked to assigned tasks + public verified reports | Unassigned private incident reports | RLS `reports_select_authenticated` |
| | UPDATE | If assigned to worker: `status`, `linked_task_id` (Transitions to `under_review`, `action_assigned`, `in_progress`, `action_taken`) | Observations, category, severity, coordinates, evidence, `verified_by`, `rejection_reason`, `verification_reward_granted` | `enforce_report_workflow()` Trigger |
| | DELETE | None | All columns | `REVOKE DELETE` + No client DELETE RLS policy |
| **`admin`** | SELECT | Full table access | None | RLS |
| | INSERT | Full table access | None | RLS |
| | UPDATE | Full workflow fields + verification/rejection sign-offs | `id`, `created_at`, `reporter_id`, `is_demo` (Immutable) | PostgreSQL Column Grant + `enforce_report_workflow()` |
| | DELETE | None (Client connections) | All records | `REVOKE DELETE` + No client DELETE RLS policy |

---

### 2.4 View: `public.public_pollution_reports`

| Role | Operation | Permitted Columns & Masking | Redacted Columns | Security Mode |
| :--- | :--- | :--- | :--- | :--- |
| **`anon` / `authenticated`** | SELECT | `id`, `category`, `title`, `description`, `lat` (Masked to 3 decimals, ~100m), `lng` (Masked to 3 decimals, ~100m), `address_name`, `severity`, `status`, `reporter_name` (Masked to 'Civic Scout' if anonymous), `linked_task_id`, `observed_at`, `created_at` | Reporter UUID (`reporter_id`), raw evidence URLs (`evidence_url`), internal verification notes (`verification_notes`) | `WITH (security_invoker = false)` owned by `postgres` (Filters to public states: verified, action_assigned, in_progress, action_taken, resolved) |
| | INSERT / UPDATE / DELETE | None | All columns | Read-only view |

---

### 2.5 Table: `public.prevention_tasks`

| Role | Operation | Permitted Columns | Prohibited / Blocked Columns | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`anon`** | ALL | None | All columns | Denied at grant level |
| **`citizen`** | SELECT | Tasks linked to own submitted reports | Unrelated municipal prevention tasks | RLS `tasks_select_restricted` |
| | INSERT | None | All columns | RLS `tasks_insert_admin_only` + `enforce_task_creation_workflow()` Trigger |
| | UPDATE / DELETE | None | All columns | Denied by RLS, `REVOKE DELETE`, and Column Grants |
| **`field_worker`** | SELECT | Tasks assigned to worker (`assigned_to_id = auth.uid()`) or unassigned pool | Tasks assigned to other officers | RLS `tasks_select_restricted` |
| | INSERT | None | All columns | RLS `tasks_insert_admin_only` + `enforce_task_creation_workflow()` Trigger |
| | UPDATE | While assigned: `status` (to `in_progress` or `completed`), `after_evidence`, `action_summary` | Directives, category, priority, risk score, coordinates, deadline, ownership reassignment, `verified_by`, `verified_at`, `verification_reward_granted`, `status = 'verified'` | PostgreSQL Column Grant + `enforce_task_workflow()` Trigger |
| | DELETE | None | All columns | `REVOKE DELETE` + No client DELETE RLS policy |
| **`admin`** | SELECT | Full table access | None | RLS |
| | INSERT | All task creation fields | Direct verified creation (`status = 'verified'`) | RLS `tasks_insert_admin_only` + `enforce_task_creation_workflow()` Trigger |
| | UPDATE | Full operational fields + `verified_by`, `verified_at`, `correction_notes`, `reviewer_notes` | `id`, `created_at`, `is_demo` (Immutable); Locked once verified | `enforce_task_workflow()` Trigger |
| | DELETE | None (Client connections) | All records | `REVOKE DELETE` + No client DELETE RLS policy |

---

### 2.6 Table: `public.task_audit_logs` (Append-Only Audit Trail)

| Role | Operation | Permitted Columns | Prohibited / Blocked Columns | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`anon` / `citizen`** | ALL | None | All columns | Denied by RLS and Grants |
| **`field_worker`** | SELECT | Audit records for tasks assigned to worker | Logs of other officers' tasks | RLS `audit_select_restricted` |
| | INSERT | Operational notes only: `task_id`, `details`, `action IN ('COMMENT_ADDED', 'STATUS_UPDATED', 'EVIDENCE_SUBMITTED')` | Lifecycle sign-offs: `TASK_ASSIGNED`, `TASK_STARTED`, `TASK_COMPLETED`, `VERIFIED_BY_ADMIN`, `RETURNED_FOR_CORRECTION` | `enforce_audit_log_actor()` Trigger (Client anti-fabrication gate) |
| | UPDATE / DELETE | None | All columns | `prevent_audit_log_tampering()` Trigger + `REVOKE UPDATE, DELETE` |
| **`admin`** | SELECT | Full audit log table | None | RLS `audit_select_restricted` |
| | INSERT | Administrative remarks & notes | Forged timestamps or false actor identities | `enforce_audit_log_actor()` Trigger |
| | UPDATE / DELETE | None | All columns | `prevent_audit_log_tampering()` Trigger (Permanent database immutability) |

---

### 2.7 Table: `public.environmental_hotspots` & View `public_environmental_hotspots`

| Role | Table / View | Permitted Operations & Columns | Prohibited Operations & Columns | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`anon`** | `environmental_hotspots` | None | All columns | `REVOKE ALL ON public.environmental_hotspots FROM anon;` (Zero direct access) |
| | `public_environmental_hotspots` | SELECT: `id`, `name`, `category`, `lat` (Masked ~1km), `lng` (Masked ~1km), `address_name`, `current_risk_score`, `current_risk_level`, `status`, `recommended_actions` | Full precision GPS, internal structural vulnerability description (`description`), `created_by` | `WITH (security_invoker = false)` owned by `postgres` |
| **`citizen` / `field_worker`** | `environmental_hotspots` | SELECT full table | INSERT, UPDATE, DELETE | `REVOKE DELETE` + RLS `hotspots_*_admin_only` + `enforce_hotspot_workflow` Trigger |
| **`admin`** | `environmental_hotspots` | SELECT, INSERT; UPDATE: `(name, category, lat, lng, address_name, current_risk_score, current_risk_level, active_reports_count, description, status, recommended_actions, last_inspected_at)` | Client DELETE; Immutable `id`, `created_at`, `created_by` | Column Grant + RLS `hotspots_*_admin_only` + `enforce_hotspot_workflow` Trigger + `REVOKE DELETE` |

---

### 2.8 Supabase Storage: `report-evidence` Bucket

| Role | Operation | Permitted Storage Scope | Prohibited Storage Scope | Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`anon`** | ALL | None | All evidence files | Private bucket (`public = false`) |
| **`citizen`** | INSERT | `evidence/{auth.uid()}/*` (Up to 10MB; JPEG/PNG/WebP/PDF) | Any other user's folder; unapproved MIME types; files >10MB | Storage RLS `evidence_authenticated_upload` |
| | SELECT | Own uploaded files (`(storage.foldername(name))[1] = auth.uid()::text`) | Other citizens' unverified evidence files | Storage RLS `evidence_owner_read` |
| | DELETE | Own uploaded files before report verification | Other users' files | Storage RLS `evidence_owner_delete` |
| **`field_worker`** | SELECT | All files in `report-evidence` bucket | Deletion of other users' files | Storage RLS `evidence_owner_read` |
| **`admin`** | ALL | Full read, upload, and deletion management across bucket | None | Storage RLS `evidence_admin_manage` |
