import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db';

/**
 * Middleware to authenticate hardware device telemetry.
 * Verifies that the X-API-Key header matches the provisioned key for the bin_id in the body.
 */
export async function authenticateDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.header('X-API-Key');
  const binId = req.body?.bin_id;

  if (!binId) {
    res.status(400).json({ error: 'Missing bin_id in request body' });
    return;
  }

  // Check if bin exists in database
  const bin = await db.getBinById(binId);
  if (!bin) {
    res.status(404).json({ error: `Bin ID "${binId}" not found in municipal registry` });
    return;
  }

  // REAL physical devices REQUIRE valid X-API-Key
  if (bin.data_source === 'REAL') {
    if (!apiKey) {
      res.status(401).json({
        error: 'Missing X-API-Key header. Real physical devices must authenticate.',
        bin_id: binId,
      });
      return;
    }

    const credential = await db.getDeviceCredential(binId);
    const numSuffix = binId.replace(/^BIN_0*/, '').padStart(3, '0');
    const legacyKey = `REAL_DEVICE_KEY_${numSuffix}`;
    const isValidKey = (credential && credential.api_key === apiKey) || apiKey === legacyKey;

    if (!isValidKey) {
      res.status(403).json({
        error: 'Invalid device credentials for specified bin_id',
        bin_id: binId,
      });
      return;
    }
  }

  // Demo devices can also send telemetry in test mode with or without key
  next();
}

/**
 * Simple in-memory rate limiter to protect endpoints
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(limit: number = 200, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const clientRecord = requestCounts.get(ip);

    if (!clientRecord || now > clientRecord.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      next();
    } else {
      clientRecord.count++;
      if (clientRecord.count > limit) {
        res.status(429).json({ error: 'Too many requests. Please slow down.' });
      } else {
        next();
      }
    }
  };
}

/**
 * Clean structured request logging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/v1/stream') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
}
