import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/database/db';
import { binService } from '../server/services/binService';
import { demoService } from '../server/services/demoService';
import { calculateFillPercent, determineStatus, validateTelemetryPayload } from '../server/validation/telemetryValidator';

describe('Smart Municipal Dustbin Platform - Verification Test Suite', () => {
  before(async () => {
    // Reset and initialize clean database state
    demoService.stopSimulation();
    db.reset();
  });

  after(() => {
    demoService.stopSimulation();
  });

  // ==========================================================================
  // 1. SENSOR LOGIC & CALIBRATION TESTS (Section 6)
  // ==========================================================================
  test('Sensor Logic: Calculates fill percentage accurately and clamps 0-100%', () => {
    // EMPTY_DISTANCE = 30cm, FULL_DISTANCE = 5cm
    // 30cm -> 0%
    assert.strictEqual(calculateFillPercent(30.0), 0);
    // 5cm -> 100%
    assert.strictEqual(calculateFillPercent(5.0), 100);
    // 17.5cm -> 50%
    assert.strictEqual(calculateFillPercent(17.5), 50);
    // 8.75cm -> 85%
    assert.strictEqual(calculateFillPercent(8.75), 85);
    // Distance beyond empty: 40cm -> Clamped to 0%
    assert.strictEqual(calculateFillPercent(40.0), 0);
    // Distance below full: 2cm -> Clamped to 100%
    assert.strictEqual(calculateFillPercent(2.0), 100);
  });

  test('Status Categorization: Correctly maps fill % to LOW, MEDIUM, HIGH, FULL', () => {
    // 0 - 49%   : LOW
    assert.strictEqual(determineStatus(0), 'LOW');
    assert.strictEqual(determineStatus(49), 'LOW');
    // 50 - 79%  : MEDIUM
    assert.strictEqual(determineStatus(50), 'MEDIUM');
    assert.strictEqual(determineStatus(79), 'MEDIUM');
    // 80 - 89%  : HIGH
    assert.strictEqual(determineStatus(80), 'HIGH');
    assert.strictEqual(determineStatus(89), 'HIGH');
    // 90 - 100% : FULL
    assert.strictEqual(determineStatus(90), 'FULL');
    assert.strictEqual(determineStatus(100), 'FULL');
  });

  test('Validation: Rejects invalid or malformed payloads', () => {
    assert.strictEqual(validateTelemetryPayload(null).isValid, false);
    assert.strictEqual(validateTelemetryPayload({}).isValid, false);
    assert.strictEqual(validateTelemetryPayload({ bin_id: '', distance_cm: 10 }).isValid, false);
    assert.strictEqual(validateTelemetryPayload({ bin_id: 'BIN_001', distance_cm: -5 }).isValid, false);

    const validResult = validateTelemetryPayload({
      bin_id: 'BIN_001',
      distance_cm: 6.8,
      fill_percent: 93,
    });
    assert.strictEqual(validResult.isValid, true);
    assert.strictEqual(validResult.data?.status, 'FULL');
  });

  // ==========================================================================
  // 2. CRITICAL REGRESSION TEST: UNIQUE DEVICE IDENTITY ISOLATION (Section 7, 38)
  // ==========================================================================
  test('CRITICAL REGRESSION TEST: Updating BIN_001 modifies ONLY BIN_001, then updating BIN_003 modifies ONLY BIN_003', async () => {
    // Capture snapshots of initial states
    const initialBin1 = await db.getBinById('BIN_001');
    const initialBin2 = await db.getBinById('BIN_002');
    const initialBin3 = await db.getBinById('BIN_003');
    const initialBin4 = await db.getBinById('BIN_004');
    const initialBin5 = await db.getBinById('BIN_005');

    assert.ok(initialBin1);
    assert.ok(initialBin2);
    assert.ok(initialBin3);
    assert.ok(initialBin4);
    assert.ok(initialBin5);

    // Step A: Send telemetry for BIN_001 = 95% (distance_cm = 6.25)
    const res1 = await binService.processTelemetry({
      bin_id: 'BIN_001',
      distance_cm: 6.25,
      fill_percent: 95,
      status: 'FULL',
    });

    assert.strictEqual(res1.success, true);
    const updatedBin1 = await db.getBinById('BIN_001');
    assert.strictEqual(updatedBin1?.current_fill_percent, 95);
    assert.strictEqual(updatedBin1?.current_status, 'FULL');

    // VERIFY ALL OTHER REAL BINS ARE 100% UNTOUCHED
    const checkBin2AfterStep1 = await db.getBinById('BIN_002');
    const checkBin3AfterStep1 = await db.getBinById('BIN_003');
    const checkBin4AfterStep1 = await db.getBinById('BIN_004');
    const checkBin5AfterStep1 = await db.getBinById('BIN_005');

    assert.strictEqual(checkBin2AfterStep1?.current_fill_percent, initialBin2.current_fill_percent);
    assert.strictEqual(checkBin3AfterStep1?.current_fill_percent, initialBin3.current_fill_percent);
    assert.strictEqual(checkBin4AfterStep1?.current_fill_percent, initialBin4.current_fill_percent);
    assert.strictEqual(checkBin5AfterStep1?.current_fill_percent, initialBin5.current_fill_percent);

    // Step B: Send telemetry for BIN_003 = 97% (distance_cm = 5.75)
    const res3 = await binService.processTelemetry({
      bin_id: 'BIN_003',
      distance_cm: 5.75,
      fill_percent: 97,
      status: 'FULL',
    });

    assert.strictEqual(res3.success, true);
    const updatedBin3 = await db.getBinById('BIN_003');
    assert.strictEqual(updatedBin3?.current_fill_percent, 97);
    assert.strictEqual(updatedBin3?.current_status, 'FULL');

    // VERIFY BIN_001 REMAINS AT 95% AND WAS NOT OVERWRITTEN BY BIN_003 TELEMETRY
    const checkBin1AfterStep2 = await db.getBinById('BIN_001');
    assert.strictEqual(checkBin1AfterStep2?.current_fill_percent, 95);

    // VERIFY OTHER BINS REMAIN UNTOUCHED
    const checkBin2AfterStep2 = await db.getBinById('BIN_002');
    const checkBin4AfterStep2 = await db.getBinById('BIN_004');
    const checkBin5AfterStep2 = await db.getBinById('BIN_005');
    assert.strictEqual(checkBin2AfterStep2?.current_fill_percent, initialBin2.current_fill_percent);
    assert.strictEqual(checkBin4AfterStep2?.current_fill_percent, initialBin4.current_fill_percent);
    assert.strictEqual(checkBin5AfterStep2?.current_fill_percent, initialBin5.current_fill_percent);
  });

  // ==========================================================================
  // 3. DEMO ISOLATION TEST (Section 3, 4, 21)
  // ==========================================================================
  test('DEMO ISOLATION: Demo simulation steps NEVER alter REAL dustbin records', async () => {
    // Record current values of all 5 real bins
    const realBinStatesBefore = await db.getAllBins({ dataSource: 'REAL' });
    assert.strictEqual(realBinStatesBefore.length, 5);

    const snapshot = new Map(
      realBinStatesBefore.map((b) => [b.bin_id, { fill: b.current_fill_percent, dist: b.current_distance_cm, updated: b.updated_at }])
    );

    // Run 5 successive simulation steps
    for (let step = 0; step < 5; step++) {
      const stepResult = await demoService.runSimulationStep();
      // Ensure only DEMO bins were in the updated list
      for (const id of stepResult.updatedBinIds) {
        assert.ok(id.startsWith('BIN_DEMO_'), `Updated id ${id} must be a demo bin`);
        assert.notStrictEqual(id, 'BIN_001');
        assert.notStrictEqual(id, 'BIN_002');
        assert.notStrictEqual(id, 'BIN_003');
        assert.notStrictEqual(id, 'BIN_004');
        assert.notStrictEqual(id, 'BIN_005');
      }
    }

    // Verify all 5 real bins are completely unmodified
    const realBinStatesAfter = await db.getAllBins({ dataSource: 'REAL' });
    assert.strictEqual(realBinStatesAfter.length, 5);

    for (const realBin of realBinStatesAfter) {
      const prev = snapshot.get(realBin.bin_id);
      assert.ok(prev);
      assert.strictEqual(realBin.current_fill_percent, prev.fill, `Real bin ${realBin.bin_id} fill must not change`);
      assert.strictEqual(realBin.current_distance_cm, prev.dist, `Real bin ${realBin.bin_id} distance must not change`);
      assert.strictEqual(realBin.updated_at, prev.updated, `Real bin ${realBin.bin_id} updated_at must not change`);
    }
  });

  // ==========================================================================
  // 4. OFFLINE DETECTION LOGIC TEST (Section 16)
  // ==========================================================================
  test('Offline Detection: Correctly classifies <5m ONLINE, 5-15m WARNING, >15m OFFLINE', () => {
    const now = Date.now();
    // 2 minutes ago -> ONLINE
    const twoMinAgo = new Date(now - 2 * 60000).toISOString();
    assert.strictEqual(binService.evaluateConnectionState(twoMinAgo), 'ONLINE');

    // 8 minutes ago -> WARNING
    const eightMinAgo = new Date(now - 8 * 60000).toISOString();
    assert.strictEqual(binService.evaluateConnectionState(eightMinAgo), 'WARNING');

    // 25 minutes ago -> OFFLINE
    const twentyFiveMinAgo = new Date(now - 25 * 60000).toISOString();
    assert.strictEqual(binService.evaluateConnectionState(twentyFiveMinAgo), 'OFFLINE');
  });

  // ==========================================================================
  // 5. COLLECTION PRIORITY ORDERING TEST (Section 18)
  // ==========================================================================
  test('Collection Priority: Correctly prioritizes FULL -> HIGH -> MEDIUM -> LOW, then highest fill first', async () => {
    const priorityQueue = await binService.getCollectionPriorityList();
    assert.ok(priorityQueue.length > 0);

    const statusOrder: Record<string, number> = {
      FULL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    for (let i = 0; i < priorityQueue.length - 1; i++) {
      const current = priorityQueue[i];
      const next = priorityQueue[i + 1];

      const currentRank = statusOrder[current.current_status];
      const nextRank = statusOrder[next.current_status];

      assert.ok(
        currentRank >= nextRank,
        `Priority invariant broken: ${current.bin_id} (${current.current_status}) must rank >= ${next.bin_id} (${next.current_status})`
      );

      if (currentRank === nextRank) {
        assert.ok(
          current.current_fill_percent >= next.current_fill_percent,
          `Tie-breaker invariant broken: ${current.bin_id} (${current.current_fill_percent}%) must have >= fill than ${next.bin_id} (${next.current_fill_percent}%)`
        );
      }
    }
  });

  // ==========================================================================
  // 6. ALERT GENERATION & RESOLUTION TEST (Section 17)
  // ==========================================================================
  test('Alerts: Triggers CRITICAL alert for >=90% and resolves when bin emptied', async () => {
    // 1. Send telemetry setting BIN_002 to 94%
    await binService.processTelemetry({
      bin_id: 'BIN_002',
      distance_cm: 6.5,
      fill_percent: 94,
      status: 'FULL',
    });

    const alertsAfterFull = await db.getAlerts({ resolved: false });
    const fullAlert = alertsAfterFull.find((a) => a.bin_id === 'BIN_002' && a.alert_type === 'FULL');
    assert.ok(fullAlert, 'BIN_002 must have an active FULL alert');
    assert.strictEqual(fullAlert.severity, 'CRITICAL');

    // 2. Empty the bin: send telemetry setting BIN_002 to 15%
    await binService.processTelemetry({
      bin_id: 'BIN_002',
      distance_cm: 26.25,
      fill_percent: 15,
      status: 'LOW',
    });

    const alertsAfterEmpty = await db.getAlerts({ resolved: false });
    const remainingFullAlert = alertsAfterEmpty.find((a) => a.bin_id === 'BIN_002');
    assert.strictEqual(remainingFullAlert, undefined, 'Active alerts for BIN_002 must be resolved after emptying');
  });

  // ==========================================================================
  // 7. AUTO-TASK DISPATCH & DEDUPLICATION ON FULL BIN
  // ==========================================================================
  test('Task Dispatch: Auto-creates collection task when bin is >=90% and deduplicates', async () => {
    // 1. Send telemetry setting BIN_004 to 92%
    await binService.processTelemetry({
      bin_id: 'BIN_004',
      distance_cm: 7.0,
      fill_percent: 92,
      status: 'FULL',
    });

    const activeTask = await db.getActiveTaskForBin('BIN_004');
    assert.ok(activeTask, 'BIN_004 must have an automatically created active collection task');
    assert.strictEqual(activeTask.priority, 'CRITICAL');
    assert.strictEqual(activeTask.status, 'ASSIGNED');
    const firstTaskId = activeTask.id;

    // 2. Send repeated telemetry packet for BIN_004
    await binService.processTelemetry({
      bin_id: 'BIN_004',
      distance_cm: 6.8,
      fill_percent: 93,
      status: 'FULL',
    });

    // Verify deduplication: no duplicate active task was created
    const allTasksForBin4 = (await db.getAllTasks()).filter((t) => t.bin_id === 'BIN_004' && t.status === 'ASSIGNED');
    assert.strictEqual(allTasksForBin4.length, 1, 'Repeated telemetry must not create duplicate active tasks');
    assert.strictEqual(allTasksForBin4[0].id, firstTaskId);
  });

  // ==========================================================================
  // 8. CITIZEN REPORT & WORKER VERIFICATION WORKFLOW
  // ==========================================================================
  test('Citizen & Worker Workflow: Report creation, task execution with proof, and supervisor approval', async () => {
    // 1. Create citizen report
    const newReport = await db.insertReport({
      id: `REP_TEST_${Date.now()}`,
      citizen_name: 'Anita Sharma',
      citizen_phone: '+91 98220 12345',
      ward: 'Ward 03',
      area: 'Shivajinagar Bus Stand',
      issue: 'Overflowing dustbin',
      description: 'Lid stuck open and garbage piling up on sidewalk',
      photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
      latitude: 18.5314,
      longitude: 73.8446,
      status: 'SUBMITTED',
      priority: 'HIGH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    assert.ok(newReport.id);
    const fetchedReport = await db.getReportById(newReport.id);
    assert.strictEqual(fetchedReport?.status, 'SUBMITTED');

    // 2. Worker completes a collection task with proof photo
    const task = await db.insertTask({
      id: `TSK_TEST_${Date.now()}`,
      report_id: newReport.id,
      bin_id: 'BIN_003',
      task_type: 'CITIZEN_REPORT',
      title: 'Clear Citizen Reported Waste',
      ward: 'Ward 03',
      location: 'Shivajinagar Bus Stand',
      priority: 'HIGH',
      assigned_worker_id: 'WRK_002',
      assigned_worker_name: 'Suresh Patil',
      status: 'IN_PROGRESS',
      before_fill_percent: 88,
      deadline: new Date(Date.now() + 3600000).toISOString(),
      created_at: new Date().toISOString(),
    });

    // Mark task completed
    const completedTask = await db.updateTask(task.id, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      after_fill_percent: 10,
      completion_photo: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
      notes: 'Cleared area and sanitized bin perimeter',
    });
    assert.strictEqual(completedTask?.status, 'COMPLETED');
    assert.strictEqual(completedTask?.after_fill_percent, 10);

    // 3. Supervisor verifies task
    const verifiedTask = await db.updateTask(task.id, {
      status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      verified_by: 'SUP_001',
    });
    assert.strictEqual(verifiedTask?.status, 'VERIFIED');
    assert.strictEqual(verifiedTask?.verified_by, 'SUP_001');
  });
});
