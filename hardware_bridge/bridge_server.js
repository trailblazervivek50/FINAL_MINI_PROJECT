/**
 * SMART GARBAGE — Lightweight IoT Hardware Bridge Server
 * 
 * Accepts HTTP POST telemetry from physical ESP8266 / Arduino
 * and broadcasts to browser clients over WebSocket and SSE.
 * 
 * Usage:
 *   node hardware_bridge/bridge_server.js
 * 
 * ESP8266 sends HTTP POST to:
 *   http://<YOUR_LAPTOP_IP>:8080/api/iot/readings
 * with JSON:
 *   {
 *     "dustbinId": "D-104",
 *     "fillPercentage": 91,
 *     "distance": 8.4,
 *     "moisture": 67
 *   }
 */

import http from 'http';

const PORT = 8080;
let latestReading = {
  dustbinId: 'D-104',
  fillPercentage: 91,
  distance: 8.4,
  moisture: 67,
  timestamp: new Date().toISOString()
};

const sseClients = new Set();

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. ESP8266 POST Telemetry Endpoint
  if (req.method === 'POST' && req.url === '/api/iot/readings') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        latestReading = {
          dustbinId: data.dustbinId || 'D-104',
          fillPercentage: Number(data.fillPercentage ?? 91),
          distance: Number(data.distance ?? 8.4),
          moisture: Number(data.moisture ?? 67),
          timestamp: data.timestamp || new Date().toISOString()
        };

        console.log(`[IoT Bridge] Telemetry received from ${latestReading.dustbinId}: Fill=${latestReading.fillPercentage}%, Dist=${latestReading.distance}cm, Moisture=${latestReading.moisture}%`);

        // Broadcast to SSE clients
        const payload = `data: ${JSON.stringify(latestReading)}\n\n`;
        sseClients.forEach(client => client.write(payload));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', received: latestReading }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 2. Browser SSE Stream Endpoint
  if (req.method === 'GET' && req.url === '/api/iot/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    sseClients.add(res);
    res.write(`data: ${JSON.stringify(latestReading)}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. Browser GET latest reading
  if (req.method === 'GET' && req.url === '/api/iot/readings') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestReading));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` SMART GARBAGE — ESP8266 Hardware Telemetry Bridge`);
  console.log(` Listening on http://localhost:${PORT}`);
  console.log(` POST endpoint: http://localhost:${PORT}/api/iot/readings`);
  console.log(` SSE stream:    http://localhost:${PORT}/api/iot/stream`);
  console.log(`===================================================`);
});
