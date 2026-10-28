import { Request, Response } from 'express';
import { db } from '../database/db';
import { CollectionTask, TaskStatus, TaskPriority } from '../models/types';
import { sseService } from '../services/sseService';

export async function handleGetTasks(req: Request, res: Response): Promise<void> {
  try {
    const { ward, status, worker_id, priority, bin_id } = req.query as {
      ward?: string;
      status?: string;
      worker_id?: string;
      priority?: string;
      bin_id?: string;
    };

    let tasks = await db.getAllTasks({ ward, status, worker_id });

    if (priority) {
      tasks = tasks.filter((t) => t.priority === priority);
    }
    if (bin_id) {
      tasks = tasks.filter((t) => t.bin_id === bin_id);
    }

    const priorityWeight: Record<TaskPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    tasks.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetTasks:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching tasks' });
  }
}

export async function handleGetTaskById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const task = await db.getTaskById(id);
    if (!task) {
      res.status(404).json({ success: false, error: `Task "${id}" not found` });
      return;
    }
    res.status(200).json({ success: true, data: task });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetTaskById:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching task' });
  }
}

export async function handleCreateTask(req: Request, res: Response): Promise<void> {
  try {
    const {
      bin_id,
      report_id,
      task_type = 'BIN_CLEARANCE',
      title,
      ward,
      location,
      priority = 'HIGH',
      assigned_worker_id,
      deadline,
      notes,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Field "title" is required' });
      return;
    }
    if (!ward || typeof ward !== 'string' || ward.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Field "ward" is required' });
      return;
    }

    let workerName = 'Unassigned Worker';
    if (assigned_worker_id) {
      const worker = await db.getWorkerById(assigned_worker_id);
      if (worker) {
        workerName = worker.name;
      }
    }

    let beforeFill: number | undefined;
    if (bin_id) {
      const bin = await db.getBinById(bin_id);
      if (bin) {
        beforeFill = bin.current_fill_percent;
      }
    }

    const taskId = `TSK_${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const taskDeadline = deadline || new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    const newTask: CollectionTask = {
      id: taskId,
      bin_id: bin_id || undefined,
      report_id: report_id || undefined,
      task_type: task_type || 'BIN_CLEARANCE',
      title: title.trim(),
      ward: ward.trim(),
      location: location ? location.trim() : 'Ward Sector',
      priority: priority || 'MEDIUM',
      assigned_worker_id: assigned_worker_id || 'WRK_001',
      assigned_worker_name: workerName,
      status: 'ASSIGNED',
      before_fill_percent: beforeFill,
      notes: notes || undefined,
      deadline: taskDeadline,
      created_at: nowIso,
    };

    const saved = await db.insertTask(newTask);

    if (assigned_worker_id) {
      await db.updateWorker(assigned_worker_id, {
        active_task_id: taskId,
        status: 'BUSY',
      });
    }

    sseService.broadcast('task_created', saved);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: saved,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleCreateTask:', err);
    res.status(500).json({ success: false, error: 'Internal server error creating task' });
  }
}

export async function handleUpdateTaskStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const existing = await db.getTaskById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: `Task "${id}" not found` });
      return;
    }

    const validStatuses: TaskStatus[] = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid task status "${status}"` });
      return;
    }

    const updates: Partial<CollectionTask> = { status };
    if (status === 'IN_PROGRESS' && !existing.started_at) {
      updates.started_at = new Date().toISOString();
    }

    const updated = await db.updateTask(id, updates);
    sseService.broadcast('task_updated', updated);

    res.status(200).json({
      success: true,
      message: 'Task status updated',
      data: updated,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleUpdateTaskStatus:', err);
    res.status(500).json({ success: false, error: 'Internal server error updating task status' });
  }
}

export async function handleCompleteTask(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const { completion_photo, after_fill_percent, notes } = req.body;

    const existing = await db.getTaskById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: `Task "${id}" not found` });
      return;
    }

    const nowIso = new Date().toISOString();
    const finalAfterFill = after_fill_percent !== undefined ? Number(after_fill_percent) : 10;

    const updates: Partial<CollectionTask> = {
      status: 'COMPLETED',
      completed_at: nowIso,
      after_fill_percent: finalAfterFill,
      completion_photo: completion_photo || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
      notes: notes !== undefined ? notes : existing.notes,
    };

    const updatedTask = await db.updateTask(id, updates);

    // Free worker
    if (existing.assigned_worker_id) {
      const worker = await db.getWorkerById(existing.assigned_worker_id);
      if (worker) {
        await db.updateWorker(worker.id, {
          status: 'ON_DUTY',
          active_task_id: undefined,
          tasks_completed_today: (worker.tasks_completed_today || 0) + 1,
        });
      }
    }

    // If associated with a dustbin, update the bin fill percentage and clear alerts
    if (existing.bin_id) {
      const bin = await db.getBinById(existing.bin_id);
      if (bin) {
        const updatedBin = await db.updateBin(bin.bin_id, {
          current_fill_percent: finalAfterFill,
          current_distance_cm: 28, // near empty distance
          current_status: 'LOW',
        });

        // Resolve active alerts
        const activeAlerts = await db.getAlerts({ resolved: false });
        for (const alert of activeAlerts) {
          if (alert.bin_id === bin.bin_id) {
            await db.resolveAlert(alert.id);
            sseService.broadcast('alert_resolved', { id: alert.id, bin_id: bin.bin_id });
          }
        }

        if (updatedBin) {
          sseService.broadcast('bin_updated', {
            bin: {
              ...updatedBin,
              connection_state: 'ONLINE',
            },
          });
        }
      }
    }

    // If associated with a citizen report, resolve it
    if (existing.report_id) {
      const report = await db.getReportById(existing.report_id);
      if (report) {
        const resolvedReport = await db.updateReport(report.id, {
          status: 'RESOLVED',
          resolution_notes: `Resolved by worker ${existing.assigned_worker_name}. ${notes || ''}`.trim(),
        });
        sseService.broadcast('report_updated', resolvedReport);
      }
    }

    sseService.broadcast('task_completed', updatedTask);

    res.status(200).json({
      success: true,
      message: 'Task marked completed with proof',
      data: updatedTask,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleCompleteTask:', err);
    res.status(500).json({ success: false, error: 'Internal server error completing task' });
  }
}

export async function handleVerifyTask(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const { approved = true, supervisor_id = 'SUP_001', notes } = req.body;

    const existing = await db.getTaskById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: `Task "${id}" not found` });
      return;
    }

    const nowIso = new Date().toISOString();
    let updates: Partial<CollectionTask>;

    if (approved) {
      updates = {
        status: 'VERIFIED',
        verified_at: nowIso,
        verified_by: supervisor_id,
        notes: notes ? `${existing.notes || ''} [Supervisor: ${notes}]` : existing.notes,
      };
    } else {
      // Re-assign if rejected
      updates = {
        status: 'ASSIGNED',
        notes: `${existing.notes || ''} [Rejected by Supervisor ${supervisor_id}: ${notes || 'Needs re-clearing'}]`,
      };
    }

    const updatedTask = await db.updateTask(id, updates);
    sseService.broadcast('task_verified', updatedTask);

    res.status(200).json({
      success: true,
      message: approved ? 'Task verified and approved' : 'Task verification rejected and re-assigned',
      data: updatedTask,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleVerifyTask:', err);
    res.status(500).json({ success: false, error: 'Internal server error verifying task' });
  }
}
