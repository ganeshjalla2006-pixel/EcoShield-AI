# EcoShield AI — Database Deployment & Operational Runbook
**Target:** Supabase PostgreSQL 15+ (Compatible with ₹0 Free Tier)  
**Version:** 5.0.0-hardened  
**Audience:** Beginners & Municipal Platform Administrators  

---

> [!CAUTION]
> **CRITICAL PRODUCTION SAFETY NOTICE:**  
> Never deploy database schema migrations or security policies directly to a live production database without prior staging verification! Always provision a temporary or staging Supabase project first, apply the migration, execute the full security test suite, and only promote to production once 100% of security assertions pass cleanly.

---

## Overview

This guide provides a phased, foolproof runbook for deploying the hardened EcoShield AI database migration to Supabase. You do **not** need command-line database tools installed on your computer; you can perform the entire migration and verification using the Supabase web dashboard.

The operational workflow follows standard security engineering best practices:
1. **Phase 1: Staging Provisioning & Migration** (Apply migration to a disposable staging project)
2. **Phase 2: Security Verification Test Execution** (Run `DATABASE_SECURITY_TESTS.sql` and verify all 17 security tests pass)
3. **Phase 3: Production Deployment & Backups** (Deploy to production only after staging verification)
4. **Phase 4: Admin Registration & Secure Provisioning** (Sign up Ganesh Reddy, verify email, and invoke `provision_initial_admin`)
5. **Phase 5: Frontend Configuration & Live Smoke Testing** (Connect `.env` and verify end-to-end functionality)
6. **Phase 6: Recovery & Troubleshooting Runbook**

---

## Phase 1: Deploy to Disposable Staging Project First

### Step 1: Create a Free Staging Supabase Project
1. Go to [supabase.com](https://supabase.com/) and sign in.
2. Click **New Project**.
3. Choose a staging project name (e.g., `ecoshield-staging`) and generate a strong database password.
4. Select your region (e.g., `South Asia (Mumbai)` for India) and select the **Free Tier (₹0 / month)**.
5. Wait ~2 minutes for the database to provision.

### Step 2: Open SQL Editor in Staging
1. In the left navigation bar of your Supabase Dashboard, click the **SQL Editor** icon (`>_`).
2. Click **New query** (or the **+** button).
3. Name the query: `01_ecoshield_staging_migration`.

### Step 3: Paste & Run `DATABASE_SCHEMA_FIXED.sql`
1. Open [`DATABASE_SCHEMA_FIXED.sql`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_SCHEMA_FIXED.sql) from your project folder.
2. Copy the entire file contents.
3. Paste into the SQL Editor query window.
4. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).
5. Verify the query finishes with:  
   `Success. No rows returned.`

---

## Phase 2: Run Security Tests in Staging (Mandatory Verification)

Before touching any production database, you must execute the security test suite to prove that row-level security policies, table grants, triggers, and immutability controls behave as specified.

### Step 4: Execute `DATABASE_SECURITY_TESTS.sql` in Staging
1. Open [`DATABASE_SECURITY_TESTS.sql`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_SECURITY_TESTS.sql) in your text editor.
2. Copy the entire contents.
3. In the Staging **SQL Editor**, open a new query tab and paste the test script.
4. Click **Run**.
5. The script runs inside a transactional block (`BEGIN ... ROLLBACK`), executing 17 comprehensive security assertions and safely reverting all temporary test rows.
6. Verify the **Results / Notices** panel outputs:
   ```text
   TEST 1 PASSED: Role update blocked as expected.
   TEST 2 PASSED: Direct EcoPoints update blocked.
   TEST 3 PASSED: Protected report fields modification blocked.
   TEST 4 PASSED: Legitimate report description edit succeeded.
   TEST 5 PASSED: Unassigned worker access blocked.
   TEST 6 PASSED: Self-verification blocked.
   TEST 7 PASSED: Valid worker progression with evidence succeeded.
   TEST 8 PASSED: Admin verification awarded +25 EcoPoints correctly.
   TEST 9 PASSED: Anti-duplicate reward protection preserved points.
   TEST 10 PASSED: Audit logs are strictly append-only and immutable.
   TEST 11 PASSED: Hotspot coordinates masked to ~1km precision.
   TEST 12 PASSED: Administrative provisioning function invocation blocked for client.
   TEST 13A PASSED: Citizen hotspot update blocked.
   TEST 13B PASSED: Field worker hotspot delete blocked.
   TEST 14A PASSED: Citizen prevention task creation blocked.
   TEST 14B PASSED: Field worker prevention task creation blocked.
   TEST 15A PASSED: Citizen report deletion denied.
   TEST 15B PASSED: Admin client report deletion denied.
   TEST 16A PASSED: Field worker task deletion denied.
   TEST 16B PASSED: Admin client task deletion denied.
   TEST 17A PASSED: Citizen hotspot deletion denied.
   TEST 17B PASSED: Admin client hotspot deletion denied.
   =============================================================
   ALL 17 DATABASE SECURITY & REGRESSION TESTS PASSED CLEANLY!
   Transaction rolled back safely. Database state unmodified.
   =============================================================
   ```

> [!IMPORTANT]
> If any test fails in Staging, do **not** proceed to production. Review the exact error message in the notices panel.

---

## Phase 3: Production Deployment & Backups

Once Staging verification passes with 17/17 tests successful, proceed to deploy to your production Supabase database.

### Step 5: Safety Backup (Existing Production Only)
If you are upgrading an existing production database:
1. In the Supabase Dashboard, click on **Database** -> **Backups**.
2. If point-in-time recovery or scheduled backups are available, ensure a recent restore point exists.
3. In the **Table Editor**, click **Export to CSV** for each table as an offline data snapshot.

### Step 6: Deploy `DATABASE_SCHEMA_FIXED.sql` to Production
1. In your Production Supabase project, navigate to **SQL Editor**.
2. Click **New query** and name it: `01_ecoshield_v5_production_migration`.
3. Paste the contents of [`DATABASE_SCHEMA_FIXED.sql`](file:///c:/Users/user/OneDrive/Desktop/demo/DATABASE_SCHEMA_FIXED.sql).
4. Click **Run**.
5. Ensure the execution completes with: `Success. No rows returned.`

---

## Phase 4: Register & Provision the Administrator

### Step 7: Register Ganesh Reddy via the Application
Before administrative privileges can be granted, the user account must exist in Supabase Auth.
1. Open the EcoShield AI frontend application in your browser.
2. Click **Sign In** -> **Need an account? Sign Up**.
3. Register using the designated administrator details:
   - **Full Name:** `Ganesh Reddy`
   - **Email:** `ganeshjalla2006@gmail.com`
   - **Password:** Choose a secure password (minimum 8 characters).
4. Check your email inbox for the Supabase verification email and click the confirmation link to verify your email address.
   *(Alternatively, in the Supabase Dashboard under **Authentication -> Users**, toggle `Confirm Email` for this user).*

### Step 8: Provision Ganesh Reddy as Municipal Administrator
1. In your Production Supabase Dashboard, go back to the **SQL Editor**.
2. Open a new query tab and execute:
   ```sql
   SELECT public.provision_initial_admin('ganeshjalla2006@gmail.com', 'Ganesh Reddy');
   ```
3. Click **Run**.
4. You will see a success confirmation output:
   ```text
   Successfully provisioned administrator: Ganesh Reddy (ganeshjalla2006@gmail.com, UID: <user-uuid>)
   ```

> [!NOTE]
> `provision_initial_admin()` can only be executed by database superusers (`postgres`) in the SQL Editor or trusted backend `service_role`. Standard anonymous and authenticated client sessions cannot execute this function.

---

## Phase 5: Connect Frontend Application & Smoke Test

### Step 9: Update Your Local `.env` File
1. In the Supabase Dashboard, click **Project Settings** (gear icon) -> **API**.
2. Copy your **Project URL** and **anon public Key**.
3. In your project root folder (`c:\Users\user\OneDrive\Desktop\demo`), create or edit `.env`:
   ```bash
   # Supabase Cloud Backend Configuration (₹0 Free Tier)
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
   ```
4. Start your development server:
   ```bash
   npm run dev
   ```
5. Log in with `ganeshjalla2006@gmail.com`. You will see the **Municipal Administrator** badge, access to the Administrative Triage Dashboard, Mitigation Dispatch, and Hotspot Management.

---

## Phase 6: Recovery & Troubleshooting Runbook

### Q1: What if a migration query fails halfway?
- Because PostgreSQL executes statements safely, any statement that encounters an error can be re-run after resolving the conflict.
- `DATABASE_SCHEMA_FIXED.sql` uses `IF NOT EXISTS` and `DROP POLICY IF EXISTS`, making it fully idempotent and safely re-runnable as many times as needed.

### Q2: What if an administrator provisioning call returns an error?
- If the error states `Target account does not exist in auth.users`: Ganesh Reddy must register an account first in the frontend.
- If the error states `Target account has not verified its email address yet`: Confirm the email address via the verification link, or in the Supabase Dashboard go to **Authentication -> Users** and click **Confirm User**.

### Q3: What if I need to roll back?
- If you backed up your data via Step 5, you can restore your backup from **Database -> Backups**.
- If needed, table structures and views can be inspected or modified via the Supabase **Table Editor**.
