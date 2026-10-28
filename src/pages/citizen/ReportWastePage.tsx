import React, { useState } from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import type { CitizenIssueType } from '../../types';
import {
  Camera,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  Info,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SAMPLE_PHOTOS = [
  {
    label: 'Overflowing Market Bin',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Street Pile Up',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Damaged Municipal Lid',
    url: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=600&auto=format&fit=crop&q=80',
  },
];

export const ReportWastePage: React.FC = () => {
  const { dustbins, submitCitizenReport } = useWasteSystem();
  const navigate = useNavigate();

  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [selectedBinId, setSelectedBinId] = useState<string>('D-104');
  const [issueType, setIssueType] = useState<CitizenIssueType>('Overflowing dustbin');
  const [description, setDescription] = useState<string>('Waste spilling onto pedestrian path outside fruit market.');
  const [geoStatus, setGeoStatus] = useState<string>('GPS Location Verified: 18.5204° N, 73.8567° E (Ward 05)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // Issues list
  const issueTypes: CitizenIssueType[] = [
    'Overflowing dustbin',
    'Garbage around dustbin',
    'Damaged dustbin',
    'Other',
  ];

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      setGeoStatus('Locating device...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoStatus(
            `GPS Verified: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`
          );
        },
        () => {
          // Graceful fallback (Requirement 21)
          setGeoStatus('Location Pin: 18.5204° N, 73.8567° E (Ward 05 Market Sector Fallback)');
        }
      );
    } else {
      setGeoStatus('Location Pin: 18.5204° N, 73.8567° E (Ward 05 Fallback)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const selectedBin = dustbins.find((b) => b.id === selectedBinId);
      const report = submitCitizenReport({
        dustbinId: selectedBinId,
        ward: selectedBin ? selectedBin.ward : 'Ward 05',
        area: selectedBin ? selectedBin.area : 'Market Area',
        issue: issueType,
        description,
        photoUrl,
        coordinates: selectedBin ? selectedBin.coordinates : [18.5204, 73.8567],
      });

      setSubmittedReport(report);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Submitted Confirmation State (Requirement 20) */}
      {submittedReport ? (
        <div className="bg-[#E9E6DF] rounded-2xl border border-[rgba(26,26,24,0.15)] p-6 sm:p-8 text-center space-y-6 shadow-md animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#1A1A18] text-[#F3F1EC] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#5D7A62]" />
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64]">
              CITIZEN INCIDENT FILED
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#1A1A18] mt-1">
              Report Received
            </h2>
            <div className="font-mono text-xl font-bold text-[#2F4B7C] mt-2">
              {submittedReport.id}
            </div>
          </div>

          {/* Duplicate Notice if triggered (Requirement 22) */}
          {submittedReport.isDuplicate && (
            <div className="bg-[#B8892D]/15 border border-[#B8892D]/40 rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#B8892D]">
                <Copy className="w-4 h-4" />
                <span>POSSIBLE DUPLICATE DETECTED</span>
              </div>
              <p className="text-xs text-[#1A1A18] mt-1">
                {submittedReport.duplicateNotice}
              </p>
              <p className="text-[11px] text-[#6E6B64] mt-1">
                Your report has been aggregated with existing ward dispatch to avoid redundant truck routing.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-left bg-[#F3F1EC] p-4 rounded-xl border border-[rgba(26,26,24,0.1)] font-mono text-xs">
            <div>
              <span className="text-[#6E6B64] block">PRIORITY EVALUATION:</span>
              <span className="font-bold text-[#A63D40] text-sm">
                {submittedReport.priority}
              </span>
            </div>
            <div>
              <span className="text-[#6E6B64] block">CURRENT STATUS:</span>
              <span className="font-bold text-[#1A1A18] text-sm">
                {submittedReport.status}
              </span>
            </div>
            <div>
              <span className="text-[#6E6B64] block">TARGET DUSTBIN:</span>
              <span className="font-bold text-[#1A1A18]">
                {submittedReport.dustbinId || 'Sector Bin'}
              </span>
            </div>
            <div>
              <span className="text-[#6E6B64] block">LOGGED AT:</span>
              <span className="font-bold text-[#1A1A18]">
                {submittedReport.timestamp}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/citizen/reports')}
              className="flex-1 py-3 rounded-lg bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] font-sans font-medium text-xs transition cursor-pointer"
            >
              Track in My Reports &rarr;
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setDescription('');
              }}
              className="py-3 px-4 rounded-lg bg-[#F3F1EC] hover:bg-[#E9E6DF] text-[#1A1A18] font-sans text-xs border border-[rgba(26,26,24,0.15)] transition cursor-pointer"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* Report Form */
        <div>
          <div className="border-b border-[rgba(26,26,24,0.15)] pb-4 mb-6">
            <div className="font-mono text-xs uppercase tracking-widest text-[#6E6B64]">
              CIVIC PARTICIPATION
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A1A18] mt-1">
              Report Waste or Overflow
            </h1>
            <p className="text-xs text-[#6E6B64] mt-1 font-sans">
              Help municipal sanitation crews pinpoint overflowing dustbins, damaged lids, or unauthorized dumping.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Photo Capture */}
            <div>
              <label className="block font-mono text-xs font-semibold text-[#1A1A18] mb-2 uppercase">
                1. Photographic Evidence
              </label>

              <div className="relative rounded-xl overflow-hidden border border-[rgba(26,26,24,0.2)] bg-[#E9E6DF] mb-3">
                <img
                  src={photoUrl}
                  alt="Incident Preview"
                  className="w-full h-52 object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-[#1A1A18]/80 backdrop-blur px-3 py-1.5 rounded-lg flex items-center justify-between text-white text-[11px] font-mono">
                  <span>Simulated Camera Feed</span>
                  <span className="text-[#86AB8B]">GEO-TAGGED</span>
                </div>
              </div>

              {/* Sample Photo selector for quick prototype testing */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                <span className="text-[11px] text-[#6E6B64] shrink-0">Sample Photos:</span>
                {SAMPLE_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(p.url)}
                    className={`px-2 py-1 rounded text-[11px] shrink-0 border transition cursor-pointer ${
                      photoUrl === p.url
                        ? 'bg-[#1A1A18] text-[#F3F1EC] border-[#1A1A18]'
                        : 'bg-[#F3F1EC] text-[#6E6B64] border-[rgba(26,26,24,0.15)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Geolocation */}
            <div className="bg-[#E9E6DF] p-4 rounded-xl border border-[rgba(26,26,24,0.12)] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-semibold text-[#1A1A18] uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2F4B7C]" />
                  2. Incident Location
                </label>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  className="font-mono text-[11px] text-[#2F4B7C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh GPS
                </button>
              </div>

              <div className="font-mono text-xs text-[#1A1A18] bg-[#F3F1EC] p-2.5 rounded-lg border border-[rgba(26,26,24,0.1)]">
                {geoStatus}
              </div>

              {/* Associated dustbin selector */}
              <div className="pt-2">
                <label className="font-mono text-[11px] text-[#6E6B64] block mb-1">
                  Nearest Monitored Dustbin (Auto-Detected):
                </label>
                <select
                  value={selectedBinId}
                  onChange={(e) => setSelectedBinId(e.target.value)}
                  className="w-full bg-[#F3F1EC] p-2 rounded-lg text-xs font-mono border border-[rgba(26,26,24,0.12)] text-[#1A1A18] focus:outline-none"
                >
                  {dustbins.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} &mdash; {b.area} ({b.ward}) [Fill: {b.fillPercentage}%]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Issue Type Selector */}
            <div>
              <label className="block font-mono text-xs font-semibold text-[#1A1A18] mb-2 uppercase">
                3. Issue Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                {issueTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIssueType(type)}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                      issueType === type
                        ? 'bg-[#1A1A18] text-[#F3F1EC] border-[#1A1A18]'
                        : 'bg-[#F3F1EC] text-[#6E6B64] border-[rgba(26,26,24,0.15)] hover:border-[#1A1A18]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Description */}
            <div>
              <label className="block font-mono text-xs font-semibold text-[#1A1A18] mb-1 uppercase">
                4. Field Notes / Remarks
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide landmarks, spill details, or odor intensity..."
                className="w-full bg-[#F3F1EC] p-3 rounded-xl border border-[rgba(26,26,24,0.15)] text-xs text-[#1A1A18] focus:outline-none focus:border-[#1A1A18]"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1A1A18] hover:bg-[#2F4B7C] text-[#F3F1EC] font-sans font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting to Municipal Registry...</span>
                </>
              ) : (
                <>
                  <span>Submit Incident Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
