import { Request, Response } from 'express';
import { db } from '../database/db';
import crypto from 'crypto';

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }

    const user = await db.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid municipal credentials' });
      return;
    }

    // Verify sha256 hash
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== user.password_hash) {
      res.status(401).json({ success: false, error: 'Invalid municipal credentials' });
      return;
    }

    // Mock JWT token
    const token = `muni_tok_${user.id}_${Date.now()}`;

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleLogin:', err);
    res.status(500).json({ success: false, error: 'Internal login error' });
  }
}

export async function handleGetCredentials(req: Request, res: Response): Promise<void> {
  try {
    const credentials = await db.getAllDeviceCredentials();
    res.status(200).json({
      success: true,
      data: credentials,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve credentials' });
  }
}
