import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function handleUploadImage(req: Request, res: Response): Promise<void> {
  try {
    const { image_data, file_name } = req.body;

    if (!image_data || typeof image_data !== 'string') {
      res.status(400).json({ success: false, error: 'Field "image_data" (base64 or URL) is required' });
      return;
    }

    // If it's already an external HTTP URL, just accept and return it
    if (image_data.startsWith('http://') || image_data.startsWith('https://')) {
      res.status(200).json({
        success: true,
        url: image_data,
        message: 'Image URL registered',
      });
      return;
    }

    // If it's a data URL / base64
    const matches = image_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      // Raw base64 string
      buffer = Buffer.from(image_data, 'base64');
    }

    // Limit size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ success: false, error: 'Image exceeds maximum size limit of 10MB' });
      return;
    }

    const filename = `proof_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    res.status(201).json({
      success: true,
      url: publicUrl,
      filename,
      message: 'Image uploaded successfully',
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleUploadImage:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing image upload' });
  }
}
