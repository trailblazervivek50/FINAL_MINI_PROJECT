import { Request, Response } from 'express';
import { demoService } from '../services/demoService';
import { binService } from '../services/binService';
import { db } from '../database/db';

export async function handleDemoStep(req: Request, res: Response): Promise<void> {
  try {
    const result = await demoService.runSimulationStep();
    res.status(200).json({
      success: true,
      message: 'Demo simulation step executed successfully',
      ...result,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleDemoStep:', err);
    res.status(500).json({ success: false, error: 'Failed to run simulation step' });
  }
}

export async function handleDemoToggle(req: Request, res: Response): Promise<void> {
  try {
    const { enabled } = req.body;
    if (enabled) {
      demoService.startSimulation();
    } else {
      demoService.stopSimulation();
    }

    res.status(200).json({
      success: true,
      ...demoService.getStatus(),
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleDemoToggle:', err);
    res.status(500).json({ success: false, error: 'Failed to toggle demo simulation' });
  }
}

export async function handleDemoStatus(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    ...demoService.getStatus(),
  });
}

/**
 * Diagnostic injection endpoint for testing real device updates or test scenarios
 */
export async function handleInjectTelemetry(req: Request, res: Response): Promise<void> {
  try {
    const { bin_id, distance_cm, fill_percent, apiKey } = req.body;

    const bin = await db.getBinById(bin_id);
    if (!bin) {
      res.status(404).json({ success: false, error: `Bin "${bin_id}" not found` });
      return;
    }

    // If real device, enforce API key
    if (bin.data_source === 'REAL') {
      const cred = await db.getDeviceCredential(bin_id);
      if (!apiKey || apiKey !== cred?.api_key) {
        res.status(403).json({
          success: false,
          error: 'Authentication failed: Invalid device key for REAL hardware bin.',
        });
        return;
      }
    }

    const result = await binService.processTelemetry({
      bin_id,
      distance_cm,
      fill_percent,
    });

    res.status(200).json({
      success: true,
      message: `Injected telemetry for ${bin_id}`,
      data: result.bin,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleInjectTelemetry:', err);
    res.status(500).json({ success: false, error: 'Failed to inject telemetry' });
  }
}
