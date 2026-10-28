import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Cpu, ShieldCheck } from 'lucide-react';
import { cardEntranceVariants } from '../utils/motion';

export const SettingsPage: React.FC = () => {
  return (
    <motion.div
      variants={cardEntranceVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#7C5CDB]" />
            <span>Platform Configuration &amp; Hardware Reference</span>
          </h1>
          <p className="text-xs text-[#334155] mt-0.5">
            Operational settings, microcontroller wiring specifications, and provisioned credentials.
          </p>
        </div>

        <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-[#F1EDFF] text-[#7C5CDB] font-semibold border border-[#EDE9FE]">
          Platform v1.0.0 Production Ready
        </span>
      </div>

      {/* Hardware Wiring Guide (Section 5) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
          <Cpu className="w-4 h-4 text-[#7C5CDB]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
            Microcontroller Wiring &amp; Electrical Pinouts (Mandatory Specification)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* HC-SR04 Ultrasonic */}
          <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-2">1. Ultrasonic HC-SR04</span>
            <ul className="space-y-1 text-[#334155] font-mono text-[11px]">
              <li>VCC &rarr; Arduino 5V</li>
              <li>GND &rarr; Arduino GND</li>
              <li>TRIG &rarr; Arduino Pin D7</li>
              <li>ECHO &rarr; Arduino Pin D6</li>
            </ul>
          </div>

          {/* 16x2 I2C LCD */}
          <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-2">2. 16x2 I2C LCD (0x27)</span>
            <ul className="space-y-1 text-[#334155] font-mono text-[11px]">
              <li>VCC &rarr; Arduino 5V</li>
              <li>GND &rarr; Arduino GND</li>
              <li>SDA &rarr; Arduino Pin A4</li>
              <li>SCL &rarr; Arduino Pin A5</li>
            </ul>
          </div>

          {/* Voltage Divider & ESP8266 */}
          <div className="p-3.5 rounded-xl bg-[#F1EDFF] border border-[#EDE9FE]">
            <span className="font-bold text-[#7C5CDB] block mb-2">3. ESP8266 &amp; Level Shifter</span>
            <ul className="space-y-1 text-[#334155] font-mono text-[11px]">
              <li>Arduino D11 (TX) &rarr; 1kΩ &rarr; junction &rarr; ESP8266 RX</li>
              <li>junction &rarr; 1kΩ &rarr; GND (50% divider: 2.5V safe)</li>
              <li>Arduino D10 (RX) &larr; ESP8266 TX (Direct)</li>
              <li>Arduino GND &harr; ESP8266 GND (Mandatory)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sensor Calibration & Rules (Section 6) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
          Sensor Physics &amp; Calibration Rules
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">EMPTY_DISTANCE:</span>
            <span className="text-base font-bold font-mono text-[#0F172A]">30.0 cm</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">FULL_DISTANCE:</span>
            <span className="text-base font-bold font-mono text-[#0F172A]">5.0 cm</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Clamping:</span>
            <span className="text-base font-bold font-mono text-[#0F172A]">0% – 100%</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Thresholds:</span>
            <span className="text-[11px] font-mono text-[#334155] block mt-1">
              Low: 0-49% | Med: 50-79%<br />
              High: 80-89% | Full: &ge;90%
            </span>
          </div>
        </div>
      </div>

      {/* Provisioned Hardware Credentials (Section 8) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">
            Provisioned Hardware Credentials (5 Real Devices)
          </h3>
        </div>
        <p className="text-xs text-[#334155]">
          Secret API keys sent in the <code className="font-mono text-[#7C5CDB] bg-[#F1EDFF] px-1 py-0.5 rounded border border-[#EDE9FE]">X-API-Key</code> HTTP header by each ESP8266 physical controller.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F7F8FC] text-[#64748B] uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
              <tr>
                <th className="p-2.5">Bin ID</th>
                <th className="p-2.5">Physical Deployment Location</th>
                <th className="p-2.5">Hardware API Key</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              <tr>
                <td className="p-2.5 font-bold text-[#0F172A]">BIN_001</td>
                <td className="p-2.5 text-[#334155] font-sans">Shivajinagar Market Main Gate (Ward 05)</td>
                <td className="p-2.5 text-[#7C5CDB] font-bold">KEY_BIN_001_SECRET_9871</td>
                <td className="p-2.5 text-[#16A34A] font-sans font-semibold">Active</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[#0F172A]">BIN_002</td>
                <td className="p-2.5 text-[#334155] font-sans">FC Road Promenade Junction (Ward 02)</td>
                <td className="p-2.5 text-[#7C5CDB] font-bold">KEY_BIN_002_SECRET_5422</td>
                <td className="p-2.5 text-[#16A34A] font-sans font-semibold">Active</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[#0F172A]">BIN_003</td>
                <td className="p-2.5 text-[#334155] font-sans">Deccan Gymkhana Bus Terminal (Ward 04)</td>
                <td className="p-2.5 text-[#7C5CDB] font-bold">KEY_BIN_003_SECRET_3319</td>
                <td className="p-2.5 text-[#16A34A] font-sans font-semibold">Active</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[#0F172A]">BIN_004</td>
                <td className="p-2.5 text-[#334155] font-sans">Swargate Metro &amp; Transit Plaza (Ward 08)</td>
                <td className="p-2.5 text-[#7C5CDB] font-bold">KEY_BIN_004_SECRET_7741</td>
                <td className="p-2.5 text-[#16A34A] font-sans font-semibold">Active</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-[#0F172A]">BIN_005</td>
                <td className="p-2.5 text-[#334155] font-sans">Pune Central Station Forecourt (Ward 03)</td>
                <td className="p-2.5 text-[#7C5CDB] font-bold">KEY_BIN_005_SECRET_1120</td>
                <td className="p-2.5 text-[#16A34A] font-sans font-semibold">Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
