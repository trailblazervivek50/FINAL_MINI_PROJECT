import { Request, Response } from 'express';
import { db } from '../database/db';

export async function handleGetWorkers(req: Request, res: Response): Promise<void> {
  try {
    const { ward, status } = req.query as { ward?: string; status?: string };
    const workers = await db.getAllWorkers({ ward, status });
    res.status(200).json({ success: true, count: workers.length, data: workers });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetWorkers:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching workers' });
  }
}

export async function handleGetWorkerById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const worker = await db.getWorkerById(id);
    if (!worker) {
      res.status(404).json({ success: false, error: `Worker "${id}" not found` });
      return;
    }

    let activeTask = null;
    if (worker.active_task_id) {
      activeTask = await db.getTaskById(worker.active_task_id);
    }

    res.status(200).json({
      success: true,
      data: {
        ...worker,
        active_task: activeTask,
      },
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetWorkerById:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching worker' });
  }
}

export async function handleUpdateWorker(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const { status, rating, active_task_id } = req.body;

    const worker = await db.getWorkerById(id);
    if (!worker) {
      res.status(404).json({ success: false, error: `Worker "${id}" not found` });
      return;
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (rating !== undefined) updates.rating = Number(rating);
    if (active_task_id !== undefined) updates.active_task_id = active_task_id || undefined;

    const updated = await db.updateWorker(id, updates);
    res.status(200).json({ success: true, message: 'Worker profile updated', data: updated });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleUpdateWorker:', err);
    res.status(500).json({ success: false, error: 'Internal server error updating worker' });
  }
}

export async function handleGetSupervisors(req: Request, res: Response): Promise<void> {
  try {
    const supervisors = await db.getAllSupervisors();
    res.status(200).json({ success: true, count: supervisors.length, data: supervisors });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetSupervisors:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching supervisors' });
  }
}
