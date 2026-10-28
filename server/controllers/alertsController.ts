import { Request, Response } from 'express';
import { db } from '../database/db';
import { DataSource } from '../models/types';
import { sseService } from '../services/sseService';

export async function handleGetAlerts(req: Request, res: Response): Promise<void> {
  try {
    const resolvedQuery = req.query.resolved !== undefined ? req.query.resolved === 'true' : undefined;
    const dataSource = req.query.dataSource as (DataSource | 'ALL');

    const alerts = await db.getAlerts({
      resolved: resolvedQuery,
      dataSource,
    });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetAlerts:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve alerts' });
  }
}

export async function handleResolveAlert(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const success = await db.resolveAlert(id);

    if (!success) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    sseService.broadcast('alert_resolved', { id });

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      id,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleResolveAlert:', err);
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
}
