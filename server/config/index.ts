import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'smart_municipal_secret_jwt_key_2026',
  
  // GIS Leaflet map tile configurations
  mapProvider: process.env.MAP_PROVIDER || 'osm',
  mapProviderApiKey: process.env.MAP_PROVIDER_API_KEY || '',
  mapTileUrl: process.env.MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  mapAttribution: process.env.MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  
  // Demo simulation options
  demoMode: process.env.DEMO_MODE !== 'false',
  demoBinCount: parseInt(process.env.DEMO_BIN_COUNT || '3', 10),
  demoUpdateIntervalMs: parseInt(process.env.DEMO_UPDATE_INTERVAL || '20000', 10),
  
  // Offline detection thresholds (minutes)
  onlineThresholdMinutes: parseInt(process.env.ONLINE_THRESHOLD_MINUTES || '5', 10),
  warningThresholdMinutes: parseInt(process.env.WARNING_THRESHOLD_MINUTES || '15', 10),

  // Ultrasonic sensor physics constants
  emptyDistanceCm: parseFloat(process.env.EMPTY_DISTANCE_CM || '30.0'),
  fullDistanceCm: parseFloat(process.env.FULL_DISTANCE_CM || '5.0'),
};
