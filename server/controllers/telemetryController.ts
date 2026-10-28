import { Request, Response } from 'express';
import { binService } from '../services/binService';

export async function handleTelemetryPost(req: Request, res: Response): Promise<void> {
  try {
    const result = await binService.processTelemetry(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry ingested successfully',
      data: result.bin,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleTelemetryPost:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing telemetry',
    });
  }
}
