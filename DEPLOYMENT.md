# SMART MUNICIPAL DUSTBIN MONITORING PLATFORM
## PRODUCTION DEPLOYMENT & INFRASTRUCTURE GUIDE

---

## 1. Production Prerequisites

- **Node.js**: v20+ LTS or v22+ LTS (Node 24 supported)
- **Database**: PostgreSQL 15+ or 16+
- **Reverse Proxy**: NGINX with WebSocket / SSE streaming proxy headers enabled
- **TLS/SSL**: Let's Encrypt / Certbot SSL certificate

---

## 2. Environment Configuration (`.env`)

Create your production environment file from `.env.example`:

```bash
cp .env.example .env
```

Configure parameters:
```ini
# Production Server Port
PORT=5000

# PostgreSQL Connection String
DATABASE_URL=postgresql://muni_user:StrongPassword2026!@localhost:5432/smart_dustbin_prod

# Session Secret Key
JWT_SECRET=production_enterprise_jwt_secret_998127391278

# Leaflet Tile Provider Configuration
# OpenStreetMap is free and requires no key.
# For high-traffic municipal GIS installations, configure MapTiler or Mapbox:
MAP_PROVIDER=osm
MAP_PROVIDER_API_KEY=
MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
MAP_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors

# Demo Simulation Configuration (Disable in strict production deployment)
DEMO_MODE=true
DEMO_BIN_COUNT=60
DEMO_UPDATE_INTERVAL=20000

# Connection Heartbeat Thresholds
ONLINE_THRESHOLD_MINUTES=5
WARNING_THRESHOLD_MINUTES=15
```

---

## 3. Database Initialization (PostgreSQL)

Execute the schema DDL script located at `server/database/schema.sql`:

```bash
psql -U muni_user -d smart_dustbin_prod -f server/database/schema.sql
```

The server also includes automatic table detection and on-demand synchronization upon boot.

---

## 4. Building & Running Production Application

### 4.1 Build Frontend Bundle
```bash
npm run build
```
Generates production assets in `dist/`.

### 4.2 Start Backend Ingestion Server
Using PM2 Process Manager:
```bash
npm install -g pm2
pm2 start server/index.ts --name "smart-dustbin-api" --interpreter ./node_modules/.bin/tsx
pm2 save
pm2 startup
```

---

## 5. NGINX Reverse Proxy Configuration

Configure NGINX to proxy requests to port `5000` while supporting **Server-Sent Events (SSE)** without buffering:

```nginx
server {
    listen 80;
    server_name smartwaste.municipal.gov;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartwaste.municipal.gov;

    ssl_certificate /etc/letsencrypt/live/smartwaste.municipal.gov/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartwaste.municipal.gov/privkey.pem;

    # Serve built React frontend
    location / {
        root /var/www/project-iot/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Server-Sent Events (SSE) Stream without buffering
    location /api/v1/stream {
        proxy_pass http://127.0.0.1:5000/api/v1/stream;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 6. Security Hardening Checklist

- [x] **Header Authentication**: Telemetry from `REAL` hardware strictly checked with `X-API-Key`.
- [x] **Rate Limiting**: Ingestion throttled to prevent DoS attacks.
- [x] **Database Sanitation**: Parameterized SQL queries prevent injection attacks.
- [x] **Data Isolation**: Hardware data is shielded from simulation state.
- [x] **Credential Confidentiality**: Device keys and secrets are stored in environment variables, never committed to frontend source bundles.
