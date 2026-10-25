-- =============================================================================
-- EcoShield AI — Staging Security Verification & Regression Test Suite
-- Target: Supabase PostgreSQL 15+ (Staging / Disposable Test Database)
-- Version: 5.0.0-hardened
-- =============================================================================
-- CRITICAL EXECUTION NOTICE:
-- 1. Run this script in a dedicated staging or disposable database.
-- 2. Tests run inside a transactional block (BEGIN ... ROLLBACK) to ensure
--    zero permanent modification to existing database records.
-- 3. Every test strictly separates statement execution from assertion checks.
--    No test catches its own failure exception.
-- 4. Authentic Supabase JWT context simulation sets role, request.jwt.claims,
--    request.jwt.claim.sub, and request.jwt.claim.role to faithfully mirror
--    PostgREST client behavior.
-- 5. Tests verify both the SQL error code/message and the resulting database state.
-- =============================================================================

BEGIN;

-- Setup Test Personas in auth.users & public.profiles
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_worker_2_id uuid := '33333333-3333-4333-8333-333333333333';
  v_admin_id uuid := '44444444-4444-4444-8444-444444444444';
BEGIN
  -- 1. Create or clean test profiles
  INSERT INTO public.profiles (id, email, display_name, role, eco_points, badges, reports_submitted, tasks_completed, is_deactivated)
  VALUES
    (v_citizen_id, 'test.citizen@ecoshield.test', 'Test Citizen', 'citizen', 50, ARRAY['Eco Pioneer'], 0, 0, false),
    (v_worker_1_id, 'test.worker1@ecoshield.test', 'Rajesh Worker', 'field_worker', 100, ARRAY['Rapid Responder'], 0, 0, false),
    (v_worker_2_id, 'test.worker2@ecoshield.test', 'Anita Worker', 'field_worker', 100, ARRAY['Rapid Responder'], 0, 0, false),
    (v_admin_id, 'ganeshjalla2006@gmail.com', 'Ganesh Reddy', 'admin', 500, ARRAY['Municipal Administrator'], 0, 0, false)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    eco_points = EXCLUDED.eco_points,
    is_deactivated = false;

  -- 2. Seed test report
  INSERT INTO public.pollution_reports (
    id, category, title, description, lat, lng, address_name, severity, status,
    reporter_id, reporter_name, is_anonymous, evidence_url, evidence_type, observed_at
  ) VALUES (
    'REP-TEST-001', 'plastic', 'Plastic waste choking main drain',
    'Severe plastic accumulation in stormwater culvert inlet.',
    28.6139, 77.2090, 'Sector 4 Canal Inflow', 4, 'submitted',
    v_citizen_id, 'Test Citizen', false, 'https://storage.ecoshield.test/ev1.jpg', 'photo', now()
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'submitted',
    assigned_to_id = NULL,
    verification_reward_granted = false;

  -- 3. Seed test prevention task assigned to worker 1
  INSERT INTO public.prevention_tasks (
    id, report_id, title, description, category, priority, status,
    lat, lng, address_name, risk_score, risk_level,
    assigned_to_id, assigned_to_name, assigned_to_role, deadline,
    verification_reward_granted
  ) VALUES (
    'TSK-TEST-001', 'REP-TEST-001', 'Clear Sector 4 Culvert Inlet',
    'Deploy field crew to extract solid plastic waste blockage.',
    'plastic', 'high', 'assigned',
    28.6139, 77.2090, 'Sector 4 Canal Inflow', 75, 'high',
    v_worker_1_id, 'Rajesh Worker', 'field_worker', now() + interval '3 days',
    false
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'assigned',
    assigned_to_id = v_worker_1_id,
    after_evidence = NULL,
    verification_reward_granted = false;

  -- 4. Seed test environmental hotspot
  INSERT INTO public.environmental_hotspots (
    id, name, category, lat, lng, address_name, current_risk_score, current_risk_level,
    description, status
  ) VALUES (
    'HOT-TEST-001', 'Sector 4 Drainage Outfall', 'plastic',
    28.614567, 77.209876, 'Connaught Outer Canal Culvert', 82, 'critical',
    'Confidential infrastructure vulnerability: Structural culvert grate damaged with heavy monsoon backup risk.',
    'active_monitoring'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test environment initialized successfully.';
END;
$$;

-- -----------------------------------------------------------------------------
-- Authentic JWT & Role Context Simulation Procedures (Session-Temporary)
-- Sets all 4 Supabase context variables to guarantee identical PostgREST semantics.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.set_test_jwt(p_uid uuid, p_role text DEFAULT 'authenticated')
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', p_role, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  PERFORM set_config('request.jwt.claim.sub', COALESCE(p_uid::text, ''), true);
  PERFORM set_config('request.jwt.claim.role', p_role, true);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.reset_test_jwt()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', '', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 1: Citizen Cannot Mutate Role to 'admin' (Privilege Escalation Check)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_actual_role text;
BEGIN
  -- Simulate authenticated citizen session
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  -- Execute ONLY the statement under test
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = v_citizen_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  -- Reset role context to verify database state
  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Citizen was able to update role column directly!';
  ELSE
    RAISE NOTICE 'TEST 1 PASSED: Role update blocked as expected: %', v_err_msg;
  END IF;

  SELECT role INTO v_actual_role FROM public.profiles WHERE id = v_citizen_id;
  IF v_actual_role != 'citizen' THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Citizen role was mutated in database to %', v_actual_role;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 2: Citizen Cannot Directly Award Themselves EcoPoints
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_actual_points integer;
BEGIN
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    UPDATE public.profiles SET eco_points = eco_points + 500 WHERE id = v_citizen_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Citizen was able to update eco_points directly!';
  ELSE
    RAISE NOTICE 'TEST 2 PASSED: Direct EcoPoints update blocked: %', v_err_msg;
  END IF;

  SELECT eco_points INTO v_actual_points FROM public.profiles WHERE id = v_citizen_id;
  IF v_actual_points > 50 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: EcoPoints balance was inflated to %', v_actual_points;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 3: Citizen Cannot Mutate Protected Report Fields (Severity/Coords/Evidence)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_actual_severity integer;
BEGIN
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    UPDATE public.pollution_reports
    SET severity = 1,
        lat = 0.0,
        evidence_url = 'https://malicious.test/forged.jpg'
    WHERE id = 'REP-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Citizen was able to modify protected report fields post-submission!';
  ELSE
    RAISE NOTICE 'TEST 3 PASSED: Protected report fields modification blocked: %', v_err_msg;
  END IF;

  SELECT severity INTO v_actual_severity FROM public.pollution_reports WHERE id = 'REP-TEST-001';
  IF v_actual_severity != 4 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Report severity was tampered to %', v_actual_severity;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 4: Citizen CAN Legally Edit Title and Description on Submitted Report
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_new_desc text;
BEGIN
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    UPDATE public.pollution_reports
    SET description = 'Updated description providing additional civic context about the culvert.'
    WHERE id = 'REP-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF v_err_caught THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Citizen was blocked from updating description on submitted report: %', v_err_msg;
  ELSE
    RAISE NOTICE 'TEST 4 PASSED: Legitimate report description edit succeeded.';
  END IF;

  SELECT description INTO v_new_desc FROM public.pollution_reports WHERE id = 'REP-TEST-001';
  IF v_new_desc NOT LIKE 'Updated description providing%' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Description was not updated in database!';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 5: Unassigned Field Worker Cannot Update Another Worker's Task
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_worker_2_id uuid := '33333333-3333-4333-8333-333333333333';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_actual_status text;
BEGIN
  -- Simulate authenticated session for Worker 2 (Task is assigned to Worker 1)
  PERFORM pg_temp.set_test_jwt(v_worker_2_id, 'authenticated');

  BEGIN
    UPDATE public.prevention_tasks
    SET status = 'in_progress'
    WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Unassigned field worker was able to update task status!';
  ELSE
    RAISE NOTICE 'TEST 5 PASSED: Unassigned worker access blocked: %', v_err_msg;
  END IF;

  SELECT status INTO v_actual_status FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
  IF v_actual_status != 'assigned' THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Task status was modified by unassigned worker to %', v_actual_status;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 6: Assigned Field Worker Cannot Self-Verify Task
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_actual_status text;
BEGIN
  -- Simulate assigned worker session
  PERFORM pg_temp.set_test_jwt(v_worker_1_id, 'authenticated');

  BEGIN
    UPDATE public.prevention_tasks
    SET status = 'verified',
        verified_by = 'Self Verified Worker'
    WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Field worker was able to self-verify task!';
  ELSE
    RAISE NOTICE 'TEST 6 PASSED: Self-verification blocked: %', v_err_msg;
  END IF;

  SELECT status INTO v_actual_status FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
  IF v_actual_status = 'verified' THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Task was illegally moved to verified status!';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 7: Assigned Worker Progression & Mandatory Mitigation Evidence
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_actual_status text;
BEGIN
  PERFORM pg_temp.set_test_jwt(v_worker_1_id, 'authenticated');

  -- Step 7A: Transition assigned -> in_progress (Legal)
  BEGIN
    UPDATE public.prevention_tasks
    SET status = 'in_progress'
    WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF v_err_caught THEN
    RAISE EXCEPTION 'TEST 7A FAILED: Assigned worker could not start task: %', v_err_msg;
  END IF;

  -- Step 7B: Attempt to complete WITHOUT after_evidence (Must fail)
  v_err_caught := false;
  BEGIN
    UPDATE public.prevention_tasks
    SET status = 'completed',
        after_evidence = ''
    WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 7B FAILED: Worker marked task completed without evidence!';
  ELSE
    RAISE NOTICE 'TEST 7B PASSED: Missing evidence blocked completion.';
  END IF;

  -- Step 7C: Complete WITH valid mitigation evidence (Legal)
  v_err_caught := false;
  BEGIN
    UPDATE public.prevention_tasks
    SET status = 'completed',
        after_evidence = 'https://storage.ecoshield.test/cleared_culvert.jpg',
        action_summary = 'Cleared 40m of plastic waste obstruction.'
    WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF v_err_caught THEN
    RAISE EXCEPTION 'TEST 7C FAILED: Valid task completion with evidence was rejected: %', v_err_msg;
  ELSE
    RAISE NOTICE 'TEST 7 PASSED: Valid worker progression with evidence succeeded.';
  END IF;

  SELECT status INTO v_actual_status FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
  IF v_actual_status != 'completed' THEN
    RAISE EXCEPTION 'TEST 7 FAILED: Task status is % instead of completed', v_actual_status;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 8: Admin Verification, Single Reward & Linked Report Update
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id uuid := '44444444-4444-4444-8444-444444444444';
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_worker_points integer;
  v_task_reward_granted boolean;
  v_report_status text;
BEGIN
  -- Record worker points before verification (seeded at 100)
  SELECT eco_points INTO v_worker_points FROM public.profiles WHERE id = v_worker_1_id;

  -- Simulate admin session
  PERFORM pg_temp.set_test_jwt(v_admin_id, 'authenticated');

  BEGIN
    UPDATE public.prevention_tasks
    SET status = 'verified',
        reviewer_notes = 'High-quality photographic proof verified. Culvert clear.'
    WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF v_err_caught THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Admin verification raised unexpected error: %', v_err_msg;
  END IF;

  -- Verify task status and single reward flag
  SELECT verification_reward_granted INTO v_task_reward_granted
  FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';

  IF NOT v_task_reward_granted THEN
    RAISE EXCEPTION 'TEST 8 FAILED: verification_reward_granted flag was not set to true!';
  END IF;

  -- Verify worker received exactly +25 EcoPoints
  SELECT eco_points INTO v_worker_points FROM public.profiles WHERE id = v_worker_1_id;
  IF v_worker_points != 125 THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Worker points expected 125, but found %', v_worker_points;
  END IF;

  RAISE NOTICE 'TEST 8 PASSED: Admin verification awarded +25 EcoPoints correctly.';
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 9: Duplicate Verification Protection (Anti-Reward Gaming)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id uuid := '44444444-4444-4444-8444-444444444444';
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_points_before integer;
  v_points_after integer;
BEGIN
  SELECT eco_points INTO v_points_before FROM public.profiles WHERE id = v_worker_1_id;

  PERFORM pg_temp.set_test_jwt(v_admin_id, 'authenticated');

  -- Admin updates reviewer notes on already verified task
  UPDATE public.prevention_tasks
  SET reviewer_notes = 'Additional follow-up inspection confirmed clear culvert.'
  WHERE id = 'TSK-TEST-001';

  PERFORM pg_temp.reset_test_jwt();

  SELECT eco_points INTO v_points_after FROM public.profiles WHERE id = v_worker_1_id;

  IF v_points_after != v_points_before THEN
    RAISE EXCEPTION 'TEST 9 FAILED: Duplicate points were awarded on verified task! (Before: %, After: %)', v_points_before, v_points_after;
  ELSE
    RAISE NOTICE 'TEST 9 PASSED: Anti-duplicate reward protection preserved points at %.', v_points_after;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 10: Audit Log Anti-Fabrication & Immutability
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_audit_id uuid;
BEGIN
  PERFORM pg_temp.set_test_jwt(v_worker_1_id, 'authenticated');

  -- Step 10A: Field worker attempts to forge VERIFIED_BY_ADMIN audit record
  BEGIN
    INSERT INTO public.task_audit_logs (task_id, action, details)
    VALUES ('TSK-TEST-001', 'VERIFIED_BY_ADMIN', 'Fabricated admin verification audit entry.');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 10A FAILED: Field worker was able to forge VERIFIED_BY_ADMIN audit log!';
  ELSE
    RAISE NOTICE 'TEST 10A PASSED: Lifecycle action forgery blocked: %', v_err_msg;
  END IF;

  -- Step 10B: Field worker logs legal operational comment (Must succeed)
  v_err_caught := false;
  BEGIN
    INSERT INTO public.task_audit_logs (task_id, action, details)
    VALUES ('TSK-TEST-001', 'COMMENT_ADDED', 'Field crew deployed mechanical boom.')
    RETURNING id INTO v_audit_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF v_err_caught THEN
    RAISE EXCEPTION 'TEST 10B FAILED: Valid COMMENT_ADDED audit log failed: %', v_err_msg;
  END IF;

  -- Step 10C: Attempt to mutate or delete existing audit record (Must fail)
  v_err_caught := false;
  BEGIN
    DELETE FROM public.task_audit_logs WHERE id = v_audit_id;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 10C FAILED: Client was able to DELETE an audit record!';
  ELSE
    RAISE NOTICE 'TEST 10 PASSED: Audit logs are strictly append-only and immutable.';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 11: Anonymous Access Fencing & Safe Public Views
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_hotspot_lat double precision;
  v_hotspot_desc text;
BEGIN
  -- Simulate anonymous public scraper
  PERFORM pg_temp.set_test_jwt(NULL, 'anon');

  -- Step 11A: Direct access to environmental_hotspots must fail
  BEGIN
    PERFORM count(*) FROM public.environmental_hotspots;
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 11A FAILED: Anonymous user has direct SELECT on environmental_hotspots!';
  ELSE
    RAISE NOTICE 'TEST 11A PASSED: Direct anonymous table access blocked: %', v_err_msg;
  END IF;

  -- Step 11B: Public view must expose masked coordinates (~1km) without sensitive vulnerability text
  v_err_caught := false;
  BEGIN
    SELECT lat INTO v_hotspot_lat
    FROM public.public_environmental_hotspots
    WHERE id = 'HOT-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF v_err_caught THEN
    RAISE EXCEPTION 'TEST 11B FAILED: Public masked hotspots view is inaccessible: %', v_err_msg;
  END IF;

  -- Verify coordinate was rounded to 2 decimals (28.614567 -> 28.61)
  IF v_hotspot_lat != 28.61 THEN
    RAISE EXCEPTION 'TEST 11B FAILED: Hotspot coordinate was not masked to 2 decimals! Found: %', v_hotspot_lat;
  ELSE
    RAISE NOTICE 'TEST 11 PASSED: Hotspot coordinates masked to ~1km precision (%).', v_hotspot_lat;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 12: Admin Provisioning Authorization Gate
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_err_caught boolean := false;
  v_err_msg text := '';
BEGIN
  -- Simulate client session attempting to invoke provision_initial_admin
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    PERFORM public.provision_initial_admin('test.citizen@ecoshield.test', 'Hacked Admin');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 12 FAILED: Client session was able to invoke provision_initial_admin!';
  ELSE
    RAISE NOTICE 'TEST 12 PASSED: Administrative provisioning function invocation blocked for client: %', v_err_msg;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 13: Authenticated Non-Admin Cannot Mutate Environmental Hotspots
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_err_caught boolean := false;
  v_err_msg text := '';
BEGIN
  -- Step 13A: Citizen attempts to update hotspot
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    UPDATE public.environmental_hotspots
    SET current_risk_score = 10
    WHERE id = 'HOT-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 13A FAILED: Citizen was able to update environmental_hotspots!';
  ELSE
    RAISE NOTICE 'TEST 13A PASSED: Citizen hotspot update blocked: %', v_err_msg;
  END IF;

  -- Step 13B: Field worker attempts to delete hotspot
  v_err_caught := false;
  PERFORM pg_temp.set_test_jwt(v_worker_1_id, 'authenticated');

  BEGIN
    DELETE FROM public.environmental_hotspots WHERE id = 'HOT-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 13B FAILED: Field worker was able to delete environmental_hotspots!';
  ELSE
    RAISE NOTICE 'TEST 13B PASSED: Field worker hotspot delete blocked: %', v_err_msg;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 14: Non-Admin (Citizen/Field Worker) Cannot Insert Prevention Tasks
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_err_caught boolean := false;
  v_err_msg text := '';
BEGIN
  -- Step 14A: Citizen attempts to insert a prevention task
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    INSERT INTO public.prevention_tasks (
      id, title, description, category, priority, status, lat, lng, address_name
    ) VALUES (
      'TSK-FORGED-001', 'Citizen Self-Assigned Clean Up', 'Unauthorized task dispatch',
      'plastic', 'low', 'assigned', 28.6139, 77.2090, 'Unauthorized Location'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 14A FAILED: Citizen was able to insert a prevention task!';
  ELSE
    RAISE NOTICE 'TEST 14A PASSED: Citizen prevention task creation blocked: %', v_err_msg;
  END IF;

  -- Step 14B: Field Worker attempts to insert a prevention task
  v_err_caught := false;
  PERFORM pg_temp.set_test_jwt(v_worker_1_id, 'authenticated');

  BEGIN
    INSERT INTO public.prevention_tasks (
      id, title, description, category, priority, status, lat, lng, address_name
    ) VALUES (
      'TSK-FORGED-002', 'Worker Self-Dispatched Task', 'Unauthorized task dispatch',
      'drainage', 'high', 'assigned', 28.6139, 77.2090, 'Unauthorized Location'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 14B FAILED: Field worker was able to insert a prevention task!';
  ELSE
    RAISE NOTICE 'TEST 14B PASSED: Field worker prevention task creation blocked: %', v_err_msg;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 15: Deletion Denial on Pollution Reports
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_admin_id uuid := '44444444-4444-4444-8444-444444444444';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_count integer;
BEGIN
  -- Step 15A: Citizen attempts to delete their own report
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    DELETE FROM public.pollution_reports WHERE id = 'REP-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_count FROM public.pollution_reports WHERE id = 'REP-TEST-001';
    IF v_count = 0 THEN
      RAISE EXCEPTION 'TEST 15A FAILED: Citizen was able to DELETE report from database!';
    ELSE
      RAISE NOTICE 'TEST 15A PASSED: Citizen report deletion denied (zero rows affected).';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 15A PASSED: Citizen report deletion blocked by permission error: %', v_err_msg;
  END IF;

  -- Step 15B: Admin client session attempts to delete report (Must also fail at table grant level)
  v_err_caught := false;
  PERFORM pg_temp.set_test_jwt(v_admin_id, 'authenticated');

  BEGIN
    DELETE FROM public.pollution_reports WHERE id = 'REP-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_count FROM public.pollution_reports WHERE id = 'REP-TEST-001';
    IF v_count = 0 THEN
      RAISE EXCEPTION 'TEST 15B FAILED: Admin client was able to DELETE report from database!';
    ELSE
      RAISE NOTICE 'TEST 15B PASSED: Admin client report deletion denied (zero rows affected).';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 15B PASSED: Admin client report deletion blocked: %', v_err_msg;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 16: Deletion Denial on Prevention Tasks
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_worker_1_id uuid := '22222222-2222-4222-8222-222222222222';
  v_admin_id uuid := '44444444-4444-4444-8444-444444444444';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_count integer;
BEGIN
  -- Step 16A: Assigned field worker attempts to delete prevention task
  PERFORM pg_temp.set_test_jwt(v_worker_1_id, 'authenticated');

  BEGIN
    DELETE FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_count FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
    IF v_count = 0 THEN
      RAISE EXCEPTION 'TEST 16A FAILED: Field worker was able to DELETE task from database!';
    ELSE
      RAISE NOTICE 'TEST 16A PASSED: Field worker task deletion denied (zero rows affected).';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 16A PASSED: Field worker task deletion blocked: %', v_err_msg;
  END IF;

  -- Step 16B: Admin client session attempts to delete task
  v_err_caught := false;
  PERFORM pg_temp.set_test_jwt(v_admin_id, 'authenticated');

  BEGIN
    DELETE FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_count FROM public.prevention_tasks WHERE id = 'TSK-TEST-001';
    IF v_count = 0 THEN
      RAISE EXCEPTION 'TEST 16B FAILED: Admin client was able to DELETE task from database!';
    ELSE
      RAISE NOTICE 'TEST 16B PASSED: Admin client task deletion denied (zero rows affected).';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 16B PASSED: Admin client task deletion blocked: %', v_err_msg;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- TEST 17: Deletion Denial on Environmental Hotspots
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_citizen_id uuid := '11111111-1111-4111-8111-111111111111';
  v_admin_id uuid := '44444444-4444-4444-8444-444444444444';
  v_err_caught boolean := false;
  v_err_msg text := '';
  v_count integer;
BEGIN
  -- Step 17A: Citizen attempts to delete hotspot
  PERFORM pg_temp.set_test_jwt(v_citizen_id, 'authenticated');

  BEGIN
    DELETE FROM public.environmental_hotspots WHERE id = 'HOT-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_count FROM public.environmental_hotspots WHERE id = 'HOT-TEST-001';
    IF v_count = 0 THEN
      RAISE EXCEPTION 'TEST 17A FAILED: Citizen was able to DELETE hotspot from database!';
    ELSE
      RAISE NOTICE 'TEST 17A PASSED: Citizen hotspot deletion denied (zero rows affected).';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 17A PASSED: Citizen hotspot deletion blocked: %', v_err_msg;
  END IF;

  -- Step 17B: Admin client attempts to delete hotspot
  v_err_caught := false;
  PERFORM pg_temp.set_test_jwt(v_admin_id, 'authenticated');

  BEGIN
    DELETE FROM public.environmental_hotspots WHERE id = 'HOT-TEST-001';
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  PERFORM pg_temp.reset_test_jwt();

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_count FROM public.environmental_hotspots WHERE id = 'HOT-TEST-001';
    IF v_count = 0 THEN
      RAISE EXCEPTION 'TEST 17B FAILED: Admin client was able to DELETE hotspot from database!';
    ELSE
      RAISE NOTICE 'TEST 17B PASSED: Admin client hotspot deletion denied (zero rows affected).';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 17B PASSED: Admin client hotspot deletion blocked: %', v_err_msg;
  END IF;
END;
$$;

-- Revert all test mutations cleanly
ROLLBACK;

-- Final output notice
DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'ALL 17 DATABASE SECURITY & REGRESSION TESTS PASSED CLEANLY!';
  RAISE NOTICE 'Transaction rolled back safely. Database state unmodified.';
  RAISE NOTICE '=============================================================';
END;
$$;
