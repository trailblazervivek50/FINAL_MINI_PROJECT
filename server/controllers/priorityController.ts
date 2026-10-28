import { Request, Response } from 'express';
import { binService } from '../services/binService';
import { demoService } from '../services/demoService';
import { db } from '../database/db';

export async function handleGetPriorityQueue(req: Request, res: Response): Promise<void> {
  try {
    const queue = await binService.getCollectionPriorityList();

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetPriorityQueue:', err);
    res.status(500).json({ success: false, error: 'Failed to generate priority queue' });
  }
}

export async function handleSimulateCollection(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const bin = await db.getBinById(id);

    if (!bin) {
      res.status(404).json({ success: false, error: `Bin "${id}" not found` });
      return;
    }

    if (bin.data_source === 'REAL') {
      res.status(400).json({
        success: false,
        error: 'Manual collection simulation is blocked for REAL physical hardware. Real hardware must clear naturally via ultrasonic sensor.',
      });
      return;
    }

    const updated = await demoService.simulateCollection(id);

    res.status(200).json({
      success: true,
      message: `Simulated municipal truck collection completed for ${id}`,
      data: updated,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleSimulateCollection:', err);
    res.status(500).json({ success: false, error: err.message || 'Collection simulation failed' });
  }
}
