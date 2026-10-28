import { Response } from 'express';

class SseService {
  private clients: Set<Response> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Send periodic heartbeat to keep connections alive through proxies
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', { timestamp: new Date().toISOString() });
    }, 15000);
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  public addClient(res: Response): void {
    this.clients.add(res);

    // Initial greeting packet
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientsCount: this.clients.size })}\n\n`);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public broadcast(event: string, data: any): void {
    if (this.clients.size === 0) return;
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (e) {
        this.clients.delete(client);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const sseService = new SseService();
