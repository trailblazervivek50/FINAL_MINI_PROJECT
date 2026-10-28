# 🗑️ SMART GARBAGE OVERFLOW DETECTION
### An IoT-Enabled Edge-to-Cloud Solid Waste Monitoring & Municipal Command Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24.15-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v8.3-purple.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-blue.svg)](https://www.postgresql.org/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-GIS_Heatmap-brightgreen.svg)](https://leafletjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.3-38B2AC.svg)](https://tailwindcss.com/)

---

## 📌 Project Overview
**SMART GARBAGE OVERFLOW DETECTION** is an interdisciplinary mini project developed at **MIT College of Railway Engineering and Research (MIT CORER), Barshi**, affiliated with **Punyashlok Ahilyadevi Holkar Solapur University (A.Y. 2026-27)**.

Traditional municipal garbage collection follows static, blind schedules—resulting in trucks visiting half-empty bins while market receptacles overflow onto roads. This project provides a complete physical IoT prototype and cloud software platform that enables continuous ultrasonic monitoring, cryptographic telemetry ingestion, multi-factor priority collection scheduling, and real-time GIS heatmap tracking across municipal wards in Barshi, Maharashtra.

---

## 👥 Interdisciplinary Project Team & Leadership

| Student Member | Department | PRN |
| :--- | :--- | :--- |
| **Borwar Vivek Suresh** | TY Computer Science & Engineering (CSE) | 2024032500020168 |
| **Andhare Shreya Vinod** | TY Electronics & Telecommunication (EN&TC) | 2024032500020219 |
| **Netake Ankita Ravi** | TY Computer Science & Engineering (CSE) | 2024032500020136 |
| **Balkunde Vivek Rameshwar** | TY Computer Science & Engineering (CSE) | 2024032500020124 |

* **Project Guide & H.O.D.:** Prof. Somnath Mule  
* **Mini Project Coordinator:** Prof. Samadhan Yadav  
* **Principal:** Dr. Madhukar Lengare  

---

## 🚀 Key System Features

1. **Physical Edge IoT Hardware Node:**
   - **Arduino UNO R3 (ATmega328P):** Deterministic sampling, 3-sample median filter, inverse fill percentage calculation, and on-site 16×2 I²C LCD driver.
   - **HC-SR04 Ultrasonic Sensor:** Continuous void distance measurement ($40\text{ kHz}$ acoustic Time-of-Flight).
   - **ESP32 DEV KIT V1:** High-performance 32-bit Wi-Fi communications gateway.
   - **Voltage Divider Protection:** Calibrated $1\text{ k}\Omega + 2\text{ k}\Omega$ resistor divider safely steps down Arduino's $5.0\text{V}$ TX logic to $3.32\text{V}$ for the ESP32 GPIO RX pin.

2. **Secure Cloud API & Database:**
   - **Node.js / Express REST API:** Bound to `0.0.0.0:5000` for seamless local LAN access.
   - **Cryptographic Security:** Every physical dustbin is authorized using dedicated `X-API-Key` headers (`KEY_BIN_001_SECRET_9871`).
   - **PostgreSQL 16 Relational Engine:** Complete schemas for `bins`, `telemetry`, `alerts`, `citizen_reports`, `tasks`, and credentials.
   - **Real-Time SSE Streaming:** Server-Sent Events (`/api/v1/stream`) with $< 0.61\text{ s}$ end-to-end propagation latency.

3. **Multi-Factor Priority Collection Algorithm:**
   $$S = 0.45 \times \text{Fill \%} + 25\text{ pts (Citizen Reports)} + 15\text{ pts (Waiting Time)} + 15\text{ pts (Area Severity)}$$
   Ranks collection tasks dynamically from $0$ to $100$ to eliminate unnecessary truck travel.

4. **Web GIS Heatmap & Civic Portals:**
   - **Command Center:** Real-time Leaflet map of Barshi wards with Kernel Density Estimation (KDE) heatmap overlays.
   - **Citizen Grievance Portal:** Geotagged photo complaints with $25\text{ m}$ spatial deduplication.
   - **Worker Task Queue:** Mobile-friendly task execution with mandatory post-collection photo proof.
   - **Supervisor Verification:** Audit desk with before/after clearance verification before closing alerts.

---

## 🛠️ Complete Technology Stack

### **Frontend:**
- **React 19 & TypeScript:** Component-based, type-safe single-page web application.
- **Vite 8:** Lightning-fast frontend build tooling with instantaneous HMR.
- **Tailwind CSS 4:** Modern municipal design system with clean white cards and yellow/orange alert accents.
- **Leaflet & React-Leaflet:** GIS map rendering with interactive ward boundaries and marker clusters.
- **Leaflet.heat:** Real-time Kernel Density Estimation (KDE) thermal heatmap.
- **Recharts:** Historical telemetry graphs and ward collection analytics.
- **Framer Motion:** Micro-animations and smooth drawer transitions.

### **Backend & Storage:**
- **Node.js & Express 5:** RESTful API endpoints and background simulation daemons.
- **PostgreSQL 16:** ACID relational storage with transactional data integrity.
- **Server-Sent Events (SSE):** Lightweight, firewall-friendly real-time browser push stream.

### **Embedded Hardware:**
- **Microcontrollers:** Arduino UNO R3 + ESP32 DEV KIT V1.
- **Sensor:** HC-SR04 Ultrasonic Distance Sensor.
- **Display:** 16×2 Character LCD with PCF8574 I²C backpack.
- **Passive Circuitry:** $1\text{ k}\Omega$ and $2\text{ k}\Omega$ resistors for level shifting.

---

## ⚡ Quick Start & Local Execution

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/trailblazervivek50/FINAL_MINI_PROJECT.git
cd FINAL_MINI_PROJECT
npm install
```

### 2. Run Test Suite
```bash
npm test
```

### 3. Start Backend Server
Runs the Express API and background demo simulator on port `5000`:
```bash
npm run server
```

### 4. Start Frontend Client
In a new terminal window, start the Vite development server on port `5173`:
```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📐 Mathematical Model & Calibration

The fill percentage is calculated from the void distance $d$ measured by the ultrasonic transducer:

$$\text{Fill \%} = \left( \frac{\text{EMPTY\_DISTANCE} - d}{\text{EMPTY\_DISTANCE} - \text{FULL\_DISTANCE}} \right) \times 100 = \left( \frac{30.0 - d}{25.0} \right) \times 100$$

Clamped strictly between $0\%$ and $100\%$:
$$\text{Fill \%}_{\text{clamped}} = \max\Big(0.0, \ \min\big(100.0, \ \text{Fill \%}_{\text{raw}}\big)\Big)$$

Operational tiers:
- **LOW (<50%):** Routine monitoring
- **MEDIUM (50–79%):** Normal active monitoring
- **HIGH (80–89%):** Warning tier (yellow/amber accent)
- **FULL (≥90%):** Critical tier (orange accent, automated collection dispatch)

---

## 📄 License & Academic Attribution
Developed as an interdisciplinary mini project for the Department of Computer Science & Engineering and Department of Electronics & Telecommunication Engineering, **MIT College of Railway Engineering and Research, Barshi**.
