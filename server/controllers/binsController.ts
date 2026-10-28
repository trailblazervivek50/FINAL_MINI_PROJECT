import { Request, Response } from 'express';
import { db } from '../database/db';
import { binService } from '../services/binService';
import { DataSource, Bin } from '../models/types';
import { sseService } from '../services/sseService';

export async function handleGetBins(req: Request, res: Response): Promise<void> {
  try {
    const { dataSource, status, ward, zone, search } = req.query;

    const bins = await binService.getEnrichedBins({
      dataSource: dataSource as (DataSource | 'ALL'),
      status: status as string,
      ward: ward as string,
      zone: zone as string,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      count: bins.length,
      data: bins,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetBins:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve bins' });
  }
}

export async function handleGetBinById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const bin = await db.getBinById(id);

    if (!bin) {
      res.status(404).json({ success: false, error: `Bin "${id}" not found` });
      return;
    }

    const connectionState = binService.evaluateConnectionState(bin.last_seen);
    const recentTelemetry = await db.getTelemetryByBin(id, 24);

    res.status(200).json({
      success: true,
      data: {
        ...bin,
        connection_state: connectionState,
        history: recentTelemetry,
      },
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetBinById:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve bin details' });
  }
}

export async function handleGetBinHistory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const history = await db.getTelemetryByBin(id, limit);

    res.status(200).json({
      success: true,
      bin_id: id,
      count: history.length,
      data: history,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetBinHistory:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve bin history' });
  }
}

export async function handleCreateBin(req: Request, res: Response): Promise<void> {
  try {
    const {
      bin_id,
      name,
      latitude,
      longitude,
      location,
      ward,
      zone,
      data_source = 'DEMO',
      device_key,
    } = req.body;

    if (!bin_id || typeof bin_id !== 'string') {
      res.status(400).json({ success: false, error: 'Field "bin_id" is required' });
      return;
    }

    const cleanBinId = bin_id.trim().toUpperCase();
    const existing = await db.getBinById(cleanBinId);
    if (existing) {
      res.status(409).json({ success: false, error: `Dustbin with ID "${cleanBinId}" already exists` });
      return;
    }

    const nowIso = new Date().toISOString();
    const newBin: Bin = {
      bin_id: cleanBinId,
      name: name ? name.trim() : `Municipal Bin ${cleanBinId}`,
      latitude: Number(latitude) || 18.5204,
      longitude: Number(longitude) || 73.8567,
      location: location ? location.trim() : 'Ward Waste Station',
      ward: ward ? ward.trim() : 'Ward 01',
      zone: zone ? zone.trim() : 'Zone Central',
      current_distance_cm: 30.0,
      current_fill_percent: 0.0,
      current_status: 'LOW',
      online: false,
      last_seen: nowIso,
      data_source: data_source === 'REAL' ? 'REAL' : 'DEMO',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const saved = await db.createBin(newBin, device_key);
    sseService.broadcast('bin_created', saved);

    res.status(201).json({
      success: true,
      message: 'New dustbin registered successfully',
      data: saved,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleCreateBin:', err);
    res.status(500).json({ success: false, error: 'Internal server error creating dustbin' });
  }
}

export async function handleUpdateBin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, location, ward, zone, latitude, longitude } = req.body;

    const existing = await db.getBinById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: `Dustbin "${id}" not found` });
      return;
    }

    const updates: Partial<Bin> = {};
    if (name) updates.name = name.trim();
    if (location) updates.location = location.trim();
    if (ward) updates.ward = ward.trim();
    if (zone) updates.zone = zone.trim();
    if (latitude !== undefined) updates.latitude = Number(latitude);
    if (longitude !== undefined) updates.longitude = Number(longitude);

    const updated = await db.updateBinDetails(id, updates);
    if (updated) {
      sseService.broadcast('bin_updated', { bin: updated });
    }

    res.status(200).json({
      success: true,
      message: 'Dustbin details updated successfully',
      data: updated,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleUpdateBin:', err);
    res.status(500).json({ success: false, error: 'Internal server error updating dustbin' });
  }
}
