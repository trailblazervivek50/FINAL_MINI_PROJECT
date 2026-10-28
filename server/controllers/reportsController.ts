import { Request, Response } from 'express';
import { db } from '../database/db';
import { CitizenReport, CitizenReportStatus, CitizenIssueType, CollectionTask } from '../models/types';
import { sseService } from '../services/sseService';

export async function handleGetReports(req: Request, res: Response): Promise<void> {
  try {
    const { ward, status, citizenPhone } = req.query as { ward?: string; status?: string; citizenPhone?: string };
    const reports = await db.getAllReports({ ward, status, citizenPhone });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetReports:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching citizen reports' });
  }
}

export async function handleGetReportById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const report = await db.getReportById(id);
    if (!report) {
      res.status(404).json({ success: false, error: `Citizen report "${id}" not found` });
      return;
    }
    res.status(200).json({ success: true, data: report });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetReportById:', err);
    res.status(500).json({ success: false, error: 'Internal server error fetching citizen report' });
  }
}

export async function handleCreateReport(req: Request, res: Response): Promise<void> {
  try {
    const {
      bin_id,
      citizen_name,
      citizen_phone,
      ward,
      area,
      issue,
      description,
      photo_url,
      latitude,
      longitude,
    } = req.body;

    if (!citizen_name || typeof citizen_name !== 'string' || citizen_name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Field "citizen_name" is required' });
      return;
    }

    if (!ward || typeof ward !== 'string' || ward.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Field "ward" is required' });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Field "description" is required' });
      return;
    }

    const validIssues: CitizenIssueType[] = [
      'Overflowing dustbin',
      'Garbage around dustbin',
      'Damaged dustbin',
      'Other',
    ];

    const cleanIssue: CitizenIssueType = validIssues.includes(issue) ? issue : 'Other';

    // If coordinates not provided, check if bin_id provided
    let lat = Number(latitude);
    let lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      if (bin_id) {
        const bin = await db.getBinById(bin_id);
        if (bin) {
          lat = bin.latitude;
          lng = bin.longitude;
        } else {
          lat = 18.5204;
          lng = 73.8567;
        }
      } else {
        lat = 18.5204;
        lng = 73.8567;
      }
    }

    const reportId = `REP_${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const newReport: CitizenReport = {
      id: reportId,
      bin_id: bin_id || undefined,
      citizen_name: citizen_name.trim(),
      citizen_phone: citizen_phone ? citizen_phone.trim() : undefined,
      ward: ward.trim(),
      area: area ? area.trim() : 'Municipal Ward Sector',
      issue: cleanIssue,
      description: description.trim(),
      photo_url: photo_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
      latitude: lat,
      longitude: lng,
      status: 'SUBMITTED',
      priority: cleanIssue === 'Overflowing dustbin' ? 'HIGH' : 'MEDIUM',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const saved = await db.insertReport(newReport);

    // Broadcast live event via SSE
    sseService.broadcast('report_created', saved);

    res.status(201).json({
      success: true,
      message: 'Citizen report submitted successfully',
      data: saved,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleCreateReport:', err);
    res.status(500).json({ success: false, error: 'Internal server error creating citizen report' });
  }
}

export async function handleUpdateReportStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const { status, assigned_worker_id, resolution_notes, rejection_reason } = req.body;

    const existing = await db.getReportById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: `Report "${id}" not found` });
      return;
    }

    const updates: Partial<CitizenReport> = {};

    if (status) {
      const validStatuses: CitizenReportStatus[] = [
        'SUBMITTED',
        'UNDER_REVIEW',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'REJECTED',
      ];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: `Invalid status "${status}"` });
        return;
      }
      updates.status = status;
    }

    if (assigned_worker_id) {
      const worker = await db.getWorkerById(assigned_worker_id);
      if (worker) {
        updates.assigned_worker_id = worker.id;
        updates.assigned_worker_name = worker.name;

        // If assigning, create a collection task if one doesn't exist
        const allTasks = await db.getAllTasks();
        const existingTask = allTasks.find((t) => t.report_id === id);
        if (!existingTask) {
          const newTask: CollectionTask = {
            id: `TSK_REP_${Date.now().toString().slice(-6)}`,
            report_id: id,
            bin_id: existing.bin_id,
            task_type: 'CITIZEN_REPORT',
            title: `Citizen Complaint: ${existing.issue} at ${existing.area}`,
            ward: existing.ward,
            location: existing.area,
            priority: existing.priority,
            assigned_worker_id: worker.id,
            assigned_worker_name: worker.name,
            status: 'ASSIGNED',
            deadline: new Date(Date.now() + 3600000 * 3).toISOString(), // 3 hours
            created_at: new Date().toISOString(),
          };
          await db.insertTask(newTask);
          sseService.broadcast('task_created', newTask);
        }
      }
    }

    if (resolution_notes) updates.resolution_notes = resolution_notes;
    if (rejection_reason) updates.rejection_reason = rejection_reason;

    const updated = await db.updateReport(id, updates);

    // Broadcast SSE
    sseService.broadcast('report_updated', updated);

    res.status(200).json({
      success: true,
      message: 'Citizen report status updated successfully',
      data: updated,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleUpdateReportStatus:', err);
    res.status(500).json({ success: false, error: 'Internal server error updating report status' });
  }
}
