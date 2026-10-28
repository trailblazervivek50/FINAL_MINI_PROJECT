import { Router, Request, Response } from 'express';
import { handleTelemetryPost } from '../controllers/telemetryController';
import {
  handleGetBins,
  handleGetBinById,
  handleGetBinHistory,
  handleCreateBin,
  handleUpdateBin,
} from '../controllers/binsController';
import { handleGetAlerts, handleResolveAlert } from '../controllers/alertsController';
import { handleGetAnalyticsSummary } from '../controllers/analyticsController';
import { handleGetPriorityQueue, handleSimulateCollection } from '../controllers/priorityController';
import {
  handleDemoStep,
  handleDemoToggle,
  handleDemoStatus,
  handleInjectTelemetry,
} from '../controllers/demoController';
import { handleLogin, handleGetCredentials } from '../controllers/authController';
import {
  handleGetReports,
  handleGetReportById,
  handleCreateReport,
  handleUpdateReportStatus,
} from '../controllers/reportsController';
import {
  handleGetTasks,
  handleGetTaskById,
  handleCreateTask,
  handleUpdateTaskStatus,
  handleCompleteTask,
  handleVerifyTask,
} from '../controllers/tasksController';
import {
  handleGetWorkers,
  handleGetWorkerById,
  handleUpdateWorker,
  handleGetSupervisors,
} from '../controllers/staffController';
import { handleUploadImage } from '../controllers/uploadController';
import { authenticateDevice } from '../middleware/auth';
import { sseService } from '../services/sseService';

export const apiRouter = Router();

// --- Health Check ---
apiRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Smart Municipal Dustbin Platform',
  });
});

// --- Real-time SSE Stream ---
apiRouter.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders?.();
  sseService.addClient(res);
});

// --- Telemetry Ingestion (Authenticated by X-API-Key) ---
apiRouter.post('/bins/telemetry', authenticateDevice, handleTelemetryPost);

// --- Dustbins Catalog & Management ---
apiRouter.get('/bins', handleGetBins);
apiRouter.post('/bins', handleCreateBin);
apiRouter.get('/bins/:id', handleGetBinById);
apiRouter.patch('/bins/:id', handleUpdateBin);
apiRouter.get('/bins/:id/history', handleGetBinHistory);

// --- Operational Alerts ---
apiRouter.get('/alerts', handleGetAlerts);
apiRouter.post('/alerts/:id/resolve', handleResolveAlert);

// --- Analytics & KPIs ---
apiRouter.get('/analytics/summary', handleGetAnalyticsSummary);

// --- Municipal Collection Priority Queue ---
apiRouter.get('/priority', handleGetPriorityQueue);
apiRouter.post('/priority/collect/:id', handleSimulateCollection);

// --- Citizen Garbage Reporting ---
apiRouter.get('/reports', handleGetReports);
apiRouter.post('/reports', handleCreateReport);
apiRouter.get('/reports/:id', handleGetReportById);
apiRouter.patch('/reports/:id/status', handleUpdateReportStatus);

// --- Municipal Collection Tasks ---
apiRouter.get('/tasks', handleGetTasks);
apiRouter.post('/tasks', handleCreateTask);
apiRouter.get('/tasks/:id', handleGetTaskById);
apiRouter.patch('/tasks/:id/status', handleUpdateTaskStatus);
apiRouter.post('/tasks/:id/complete', handleCompleteTask);
apiRouter.post('/tasks/:id/verify', handleVerifyTask);

// --- Municipal Field Personnel ---
apiRouter.get('/workers', handleGetWorkers);
apiRouter.get('/workers/:id', handleGetWorkerById);
apiRouter.patch('/workers/:id', handleUpdateWorker);
apiRouter.get('/supervisors', handleGetSupervisors);

// --- Media Upload (Photos/Proof) ---
apiRouter.post('/upload/image', handleUploadImage);

// --- Demo Simulation Controls ---
apiRouter.get('/demo/status', handleDemoStatus);
apiRouter.post('/demo/step', handleDemoStep);
apiRouter.post('/demo/toggle', handleDemoToggle);
apiRouter.post('/demo/inject-telemetry', handleInjectTelemetry);

// --- Authentication & Device Credentials ---
apiRouter.post('/auth/login', handleLogin);
apiRouter.get('/auth/credentials', handleGetCredentials);
