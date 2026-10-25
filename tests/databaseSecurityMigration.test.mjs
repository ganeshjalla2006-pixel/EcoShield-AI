import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * EcoShield AI — Database Schema & Security Migration Static Audit Test Suite
 * 
 * Verifies that the SQL migration file DATABASE_SCHEMA_FIXED.sql and the
 * test suite DATABASE_SECURITY_TESTS.sql satisfy all architectural security requirements.
 */

const SQL_FILE_PATH = path.resolve('DATABASE_SCHEMA_FIXED.sql');
const TESTS_SQL_PATH = path.resolve('DATABASE_SECURITY_TESTS.sql');

test('Database Migration — File Existence & Version Integrity', () => {
  assert.ok(fs.existsSync(SQL_FILE_PATH), 'DATABASE_SCHEMA_FIXED.sql must exist');
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  assert.match(sql, /Version:\s*5\.0\.0-hardened/, 'Schema migration must be Version 5.0.0-hardened');
  assert.match(sql, /Target Engine:\s*Supabase PostgreSQL 15\+/, 'Target engine must specify Supabase PostgreSQL 15+');
});

test('Database Migration — Elimination of Insecure Authorization Shortcuts', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  // Strip single-line comments (-- ...) and multi-line comments (/* ... */) to test executable SQL
  const executableSql = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Verify that executable SQL does not rely on CURRENT_USER shortcut in protect_profile_fields
  assert.doesNotMatch(
    executableSql,
    /v_is_db_superuser\s*:=\s*\(CURRENT_USER\s+IN\s+\('postgres',\s*'supabase_admin'\)\)/,
    'protect_profile_fields must not rely on CURRENT_USER shortcut'
  );

  // Verify no executable reliance on pg_trigger_depth()
  assert.doesNotMatch(executableSql, /pg_trigger_depth\s*\(\)/, 'Executable code must not use pg_trigger_depth()');

  // Verify no executable reliance on session variables for authorization bypass
  assert.doesNotMatch(
    executableSql,
    /current_setting\s*\(\s*'ecoshield\.internal_system_action'/,
    'Executable code must not rely on client-settable session variables'
  );
});

test('Database Migration — Column-Level Privilege Hardening', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  // Check column-level UPDATE grant on profiles
  assert.match(
    sql,
    /GRANT UPDATE \(display_name,\s*department,\s*avatar_url\) ON public\.profiles TO authenticated;/,
    'Authenticated role must only have column-level UPDATE on non-sensitive profile fields'
  );

  // Check that task_audit_logs UPDATE and DELETE are revoked
  assert.match(
    sql,
    /REVOKE UPDATE,\s*DELETE ON public\.task_audit_logs FROM authenticated,\s*anon,\s*PUBLIC;/,
    'UPDATE and DELETE must be explicitly revoked on task_audit_logs'
  );

  // Check that DELETE is explicitly revoked on all core tables
  assert.match(
    sql,
    /REVOKE DELETE ON public\.pollution_reports FROM PUBLIC,\s*anon,\s*authenticated;/,
    'DELETE must be explicitly revoked on pollution_reports'
  );
  assert.match(
    sql,
    /REVOKE DELETE ON public\.prevention_tasks FROM PUBLIC,\s*anon,\s*authenticated;/,
    'DELETE must be explicitly revoked on prevention_tasks'
  );
  assert.match(
    sql,
    /REVOKE DELETE ON public\.environmental_hotspots FROM PUBLIC,\s*anon,\s*authenticated;/,
    'DELETE must be explicitly revoked on environmental_hotspots'
  );

  // Check that prevention task creation is guarded by BEFORE INSERT trigger
  assert.match(
    sql,
    /CREATE TRIGGER trg_enforce_task_creation\s+BEFORE INSERT ON public\.prevention_tasks/,
    'prevention_tasks must feature BEFORE INSERT trigger enforcing admin-only dispatch'
  );
});

test('Database Migration — Single Reward & Concurrent Verification Guards', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  // Both tables must have verification_reward_granted column
  assert.match(
    sql,
    /verification_reward_granted BOOLEAN NOT NULL DEFAULT false/,
    'Tables must feature verification_reward_granted column'
  );

  // Check that reports enforce single reward
  assert.match(
    sql,
    /IF NOT COALESCE\(OLD\.verification_reward_granted,\s*false\) THEN[\s\S]*?NEW\.verification_reward_granted = true;/,
    'Report verification must enforce single reward via verification_reward_granted guard'
  );

  // Check that tasks enforce single reward
  assert.match(
    sql,
    /IF NOT COALESCE\(OLD\.verification_reward_granted,\s*false\) THEN[\s\S]*?NEW\.verification_reward_granted = true;[\s\S]*?eco_points = eco_points \+ 25/,
    'Task verification must enforce single reward via verification_reward_granted guard'
  );
});

test('Database Migration — Automated Audit Trail & Anti-Forgery Protection', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  // Check automated task creation trigger
  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.log_task_creation_audit\(\)/,
    'log_task_creation_audit function must exist'
  );

  // Check automated transition audit logging in enforce_task_workflow
  assert.match(sql, /'TASK_STARTED'/, 'enforce_task_workflow must automatically log TASK_STARTED');
  assert.match(sql, /'TASK_COMPLETED'/, 'enforce_task_workflow must automatically log TASK_COMPLETED');
  assert.match(sql, /'RETURNED_FOR_CORRECTION'/, 'enforce_task_workflow must automatically log RETURNED_FOR_CORRECTION');
  assert.match(sql, /'VERIFIED_BY_ADMIN'/, 'enforce_task_workflow must automatically log VERIFIED_BY_ADMIN');

  // Check that direct client inserts cannot forge lifecycle actions without valid status
  assert.match(
    sql,
    /IF NEW\.action NOT IN \('COMMENT_ADDED',\s*'STATUS_UPDATED',\s*'EVIDENCE_SUBMITTED'\) THEN/,
    'Direct client inserts must be restricted from submitting lifecycle sign-off actions'
  );

  // Check trigger blocking audit log tampering
  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.prevent_audit_log_tampering\(\)/,
    'prevent_audit_log_tampering function must exist'
  );
});

test('Database Migration — Environmental Hotspots Least-Privilege & Immutability', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  // Verify direct table access is revoked from anon
  assert.match(
    sql,
    /REVOKE ALL ON public\.environmental_hotspots FROM anon;/,
    'Direct table access on environmental_hotspots must be revoked from anon'
  );

  // Verify column-restricted UPDATE on environmental_hotspots
  assert.match(
    sql,
    /GRANT UPDATE \(name, category, lat, lng, address_name, current_risk_score, current_risk_level, active_reports_count, description, status, recommended_actions, last_inspected_at\) ON public\.environmental_hotspots TO authenticated;/,
    'UPDATE on environmental_hotspots must be column-restricted'
  );

  // Verify defense-in-depth trigger enforce_hotspot_workflow exists
  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.enforce_hotspot_workflow\(\)/,
    'enforce_hotspot_workflow trigger function must exist'
  );
});

test('Database Migration — Privacy Views & Coordinate Masking', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  // Public pollution reports view: masks to 3 decimals (~100m)
  assert.match(
    sql,
    /round\(lat::numeric,\s*3\)::double precision AS lat/,
    'public_pollution_reports must mask lat to 3 decimal places'
  );

  // Public hotspots view: masks to 2 decimals (~1km)
  assert.match(
    sql,
    /round\(lat::numeric,\s*2\)::double precision AS lat/,
    'public_environmental_hotspots must mask lat to 2 decimal places'
  );

  // Anonymous role must only be granted SELECT on views
  assert.match(
    sql,
    /GRANT SELECT ON public\.public_pollution_reports TO anon;/,
    'anon must have SELECT on public_pollution_reports'
  );
  assert.match(
    sql,
    /GRANT SELECT ON public\.public_profiles TO anon;/,
    'anon must have SELECT on public_profiles'
  );
  assert.match(
    sql,
    /GRANT SELECT ON public\.public_environmental_hotspots TO anon;/,
    'anon must have SELECT on public_environmental_hotspots'
  );
});

test('Database Migration — Supabase Storage RLS Provisions', () => {
  const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

  assert.match(sql, /storage\.buckets/, 'Storage bucket configuration must exist');
  assert.match(sql, /'report-evidence'/, 'Private report-evidence bucket must be provisioned');
  assert.match(sql, /10485760/, 'File size limit must be 10MB');
  assert.match(
    sql,
    /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/,
    'Storage policy must enforce user folder ownership'
  );
});

test('Database Security Tests — Test Harness Architecture & Assertions', () => {
  assert.ok(fs.existsSync(TESTS_SQL_PATH), 'DATABASE_SECURITY_TESTS.sql must exist');
  const testSql = fs.readFileSync(TESTS_SQL_PATH, 'utf8');

  // Verify tests run in a transaction with clean rollback
  assert.match(testSql, /^BEGIN;/m, 'Tests must start with BEGIN;');
  assert.match(testSql, /^ROLLBACK;/m, 'Tests must roll back to avoid corrupting data');

  // Verify tests do not catch their own RAISE EXCEPTION
  assert.match(
    testSql,
    /IF NOT v_err_caught THEN[\s\S]*?RAISE EXCEPTION/,
    'Tests must check error flag outside the statement execution block'
  );

  // Verify authentic Supabase JWT context simulator exists
  assert.match(testSql, /FUNCTION pg_temp\.set_test_jwt/, 'Test suite must define authentic JWT simulation procedure');
  assert.match(testSql, /FUNCTION pg_temp\.reset_test_jwt/, 'Test suite must define JWT context reset procedure');

  // Verify all 17 security tests exist
  for (let i = 1; i <= 17; i++) {
    assert.match(testSql, new RegExp(`TEST ${i}:`), `TEST ${i} must exist in DATABASE_SECURITY_TESTS.sql`);
  }
});
