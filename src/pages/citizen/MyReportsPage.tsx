import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Plus, Copy } from 'lucide-react';
import { STATUS_COLORS } from '../../config/thresholds';

export const MyReportsPage: React.FC = () => {
  const { reports } = useWasteSystem();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[rgba(26,26,24,0.15)] mb-6">
        <div>
          <Link
            to="/citizen"
            className="flex items-center gap-1.5 text-xs font-mono text-[#6E6B64] hover:text-[#1A1A18] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO HOME</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A1A18]">
            Citizen Report History
          </h1>
          <p className="text-xs text-[#6E6B64] mt-1 font-sans">
            Review status updates and supervisor verification for your submitted incidents.
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="px-3 py-2 rounded-lg bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Report</span>
        </Link>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => {
          const priorityColor = STATUS_COLORS[(report.priority as any) || 'NORMAL'] || STATUS_COLORS.NORMAL;

          return (
            <div
              key={report.id}
              className="bg-[#E9E6DF] rounded-xl border border-[rgba(26,26,24,0.15)] p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <img
                  src={report.photoUrl}
                  alt="Report thumb"
                  className="w-16 h-16 rounded-lg object-cover border border-[rgba(26,26,24,0.15)] shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#1A1A18]">
                      {report.id}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${priorityColor.text} ${priorityColor.bg}`}
                    >
                      {report.priority} PRIORITY
                    </span>
                    {report.isDuplicate && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#B8892D]/20 text-[#B8892D] font-bold flex items-center gap-1">
                        <Copy className="w-2.5 h-2.5" /> DUPLICATE
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-semibold text-[#1A1A18]">{report.issue}</div>
                  <div className="text-xs text-[#6E6B64] line-clamp-1">{report.description}</div>
                  <div className="font-mono text-[11px] text-[#6E6B64]">
                    Sector: {report.area} &bull; {report.ward} &bull; Logged at {report.timestamp}
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className="sm:text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(26,26,24,0.1)]">
                <span className="font-mono text-[11px] text-[#6E6B64] block sm:inline mr-2">STATUS:</span>
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-1 rounded inline-block ${
                    report.status === 'RESOLVED'
                      ? 'bg-[#5D7A62] text-white'
                      : report.status === 'DUPLICATE'
                      ? 'bg-[#B8892D] text-white'
                      : 'bg-[#1A1A18] text-[#F3F1EC]'
                  }`}
                >
                  {report.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
