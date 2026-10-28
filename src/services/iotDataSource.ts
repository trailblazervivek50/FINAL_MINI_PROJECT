import type { SensorReading } from '../types';

export type DataSourceMode = 'DEMO' | 'LIVE';

export type TelemetryListener = (reading: SensorReading) => void;

export interface IoTDataSource {
  mode: DataSourceMode;
  subscribe(listener: TelemetryListener): () => void;
  sendReading(reading: Partial<SensorReading> & { dustbinId: string }): void;
  setMode(mode: DataSourceMode): void;
  isConnected(): boolean;
}

class BroadcastAndStorageBridge {
  private channel: BroadcastChannel | null = null;
  private listeners: TelemetryListener[] = [];

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('smart_garbage_telemetry_bus');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.dustbinId) {
            this.notify(event.data);
          }
        };
      }
    } catch {
      // Fallback if BroadcastChannel is blocked
    }

    // Also listen to storage events for cross-tab or external bridge updates
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'smart_garbage_latest_telemetry' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notify(data);
          } catch {
            // ignore
          }
        }
      });

      // Also listen to postMessage from iframe or external parent
      window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'IOT_TELEMETRY' && e.data.reading) {
          this.notify(e.data.reading);
        }
      });
    }
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify(reading: SensorReading) {
    this.listeners.forEach((l) => l(reading));
  }

  public broadcast(reading: SensorReading) {
    if (this.channel) {
      try {
        this.channel.postMessage(reading);
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smart_garbage_latest_telemetry', JSON.stringify(reading));
      } catch {
        // ignore
      }
    }
    this.notify(reading);
  }
}

export const telemetryBridge = new BroadcastAndStorageBridge();

/**
 * Mock IoT Data Source for demonstration mode
 */
export class MockIoTDataSource implements IoTDataSource {
  public mode: DataSourceMode = 'DEMO';
  private listeners: TelemetryListener[] = [];
  private intervalId: number | null = null;

  constructor() {
    // Forward from global bridge
    telemetryBridge.subscribe((reading) => {
      this.listeners.forEach((fn) => fn(reading));
    });
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public sendReading(reading: Partial<SensorReading> & { dustbinId: string }): void {
    const fullReading: SensorReading = {
      dustbinId: reading.dustbinId,
      fillPercentage: reading.fillPercentage ?? 91,
      distance: reading.distance ?? Number(((100 - (reading.fillPercentage ?? 91)) * 0.9).toFixed(1)),
      moisture: reading.moisture ?? 67,
      timestamp: reading.timestamp ?? new Date().toISOString(),
    };
    telemetryBridge.broadcast(fullReading);
  }

  public setMode(mode: DataSourceMode): void {
    this.mode = mode;
  }

  public isConnected(): boolean {
    return true; // Demo mode always operational
  }

  public startDriftSimulation(targetBinId = 'D-104') {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(() => {
      if (this.mode === 'DEMO') {
        const timestamp = new Date().toISOString();
        telemetryBridge.broadcast({
          dustbinId: targetBinId,
          fillPercentage: 91,
          distance: 8.4,
          moisture: 67,
          timestamp,
        });
      }
    }, 25000);
  }

  public stopDriftSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/**
 * Real IoT Data Source for physical ESP8266 + Arduino connection
 */
export class RealIoTDataSource implements IoTDataSource {
  public mode: DataSourceMode = 'LIVE';
  private listeners: TelemetryListener[] = [];
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private connected = false;
  private bridgeUrl: string;

  constructor(bridgeUrl = 'ws://localhost:8080/ws') {
    this.bridgeUrl = bridgeUrl;
    this.initSocket();
    this.initSSE();
    telemetryBridge.subscribe((reading) => {
      this.listeners.forEach((fn) => fn(reading));
    });
  }

  private initSSE() {
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        this.sse = new EventSource('http://localhost:8080/api/iot/stream');
        this.sse.onopen = () => {
          this.connected = true;
        };
        this.sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.dustbinId) {
              telemetryBridge.broadcast(data);
            }
          } catch {
            // ignore
          }
        };
        this.sse.onerror = () => {
          // Keep connected flag according to WS/SSE state
        };
      }
    } catch {
      // ignore
    }
  }

  private initSocket() {
    try {
      this.ws = new WebSocket(this.bridgeUrl);
      this.ws.onopen = () => {
        this.connected = true;
      };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.dustbinId) {
            telemetryBridge.broadcast(data);
          }
        } catch {
          // ignore invalid json
        }
      };
      this.ws.onerror = () => {
        this.connected = false;
      };
      this.ws.onclose = () => {
        this.connected = false;
      };
    } catch {
      this.connected = false;
    }
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public sendReading(reading: Partial<SensorReading> & { dustbinId: string }): void {
    const fullReading: SensorReading = {
      dustbinId: reading.dustbinId,
      fillPercentage: reading.fillPercentage ?? 91,
      distance: reading.distance ?? 8.4,
      moisture: reading.moisture ?? 67,
      timestamp: reading.timestamp ?? new Date().toISOString(),
    };
    telemetryBridge.broadcast(fullReading);
  }

  public setMode(mode: DataSourceMode): void {
    this.mode = mode;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instances
export const mockIoTSource = new MockIoTDataSource();
export const realIoTSource = new RealIoTDataSource();

let activeDataSource: IoTDataSource = mockIoTSource;

export function getActiveIoTSource(): IoTDataSource {
  return activeDataSource;
}

export function setActiveIoTSource(source: IoTDataSource): void {
  activeDataSource = source;
}
