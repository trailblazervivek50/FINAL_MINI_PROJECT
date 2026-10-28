import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MunicipalProvider } from './context/MunicipalContext';
import { WasteSystemProvider } from './context/WasteSystemContext';
import { AppLayout } from './layouts/AppLayout';

// Master Command Center Pages
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { DustbinsCatalogPage } from './pages/DustbinsCatalogPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PriorityPage } from './pages/PriorityPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { SettingsPage } from './pages/SettingsPage';

// Civic Management & Field Operations Pages
import { CitizenReportsPage } from './pages/authority/CitizenReportsPage';
import { TasksMonitoringPage } from './pages/authority/TasksMonitoringPage';
import { WorkersPage } from './pages/authority/WorkersPage';
import { DustbinDetailPage } from './pages/authority/DustbinDetailPage';

// Citizen Portal Pages
import { CitizenHomePage } from './pages/citizen/CitizenHomePage';
import { ReportWastePage } from './pages/citizen/ReportWastePage';
import { MyReportsPage } from './pages/citizen/MyReportsPage';

// Worker Portal Pages
import { WorkerDashboardPage } from './pages/worker/WorkerDashboardPage';
import { WorkerTasksPage } from './pages/worker/WorkerTasksPage';
import { TaskDetailPage } from './pages/worker/TaskDetailPage';

// Supervisor Portal Pages
import { SupervisorOperationsPage } from './pages/supervisor/SupervisorOperationsPage';
import { SupervisorVerificationPage } from './pages/supervisor/SupervisorVerificationPage';
import { SupervisorWorkersPage } from './pages/supervisor/SupervisorWorkersPage';

export function App() {
  return (
    <MunicipalProvider>
      <WasteSystemProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              {/* 1. Dashboard Command Center */}
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* 2. Interactive Leaflet GIS Map */}
              <Route path="map" element={<LiveMapPage />} />

              {/* 3. Dustbins Master Inventory Catalog & Detail */}
              <Route path="bins" element={<DustbinsCatalogPage />} />
              <Route path="bins/:id" element={<DustbinDetailPage />} />
              <Route path="dustbins" element={<DustbinsCatalogPage />} />
              <Route path="dustbins/:id" element={<DustbinDetailPage />} />

              {/* 4. Garbage Accumulation GIS Heatmap - REMOVED */}

              {/* 5. Citizen Reports & Community Incidents */}
              <Route path="reports" element={<CitizenReportsPage />} />

              {/* 6. Field Sanitation Tasks Monitoring */}
              <Route path="tasks" element={<TasksMonitoringPage />} />

              {/* 7. Municipal Sanitation Workers Directory */}
              <Route path="workers" element={<WorkersPage />} />

              {/* 8. Incident & Capacity Alerts */}
              <Route path="alerts" element={<AlertsPage />} />

              {/* 9. Analytics & Trends */}
              <Route path="analytics" element={<AnalyticsPage />} />

              {/* 10. Municipal Collection Priority Queue */}
              <Route path="priority" element={<PriorityPage />} />

              {/* 11. Demo Fleet & Hardware Simulator */}
              <Route path="simulator" element={<SimulatorPage />} />

              {/* 12. Configuration & Hardware Pinout Guide */}
              <Route path="settings" element={<SettingsPage />} />

              {/* --- CITIZEN PORTAL --- */}
              <Route path="citizen" element={<CitizenHomePage />} />
              <Route path="citizen/report" element={<ReportWastePage />} />
              <Route path="citizen/my-reports" element={<MyReportsPage />} />

              {/* --- WORKER PORTAL --- */}
              <Route path="worker" element={<WorkerDashboardPage />} />
              <Route path="worker/tasks" element={<WorkerTasksPage />} />
              <Route path="worker/tasks/:id" element={<TaskDetailPage />} />

              {/* --- SUPERVISOR PORTAL --- */}
              <Route path="supervisor" element={<SupervisorOperationsPage />} />
              <Route path="supervisor/verification" element={<SupervisorVerificationPage />} />
              <Route path="supervisor/workers" element={<SupervisorWorkersPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WasteSystemProvider>
    </MunicipalProvider>
  );
}

export default App;
