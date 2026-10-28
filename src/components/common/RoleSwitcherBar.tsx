import React from 'react';
import { useWasteSystem } from '../../context/WasteSystemContext';
import { UserRole } from '../../types';
import { ShieldCheck, HardHat, CheckSquare, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, setCurrentRole } = useWasteSystem();
  const navigate = useNavigate();
  const location = useLocation();

  const roles: { role: UserRole; label: string; path: string; icon: React.ReactNode }[] = [
    {
      role: 'AUTHORITY',
      label: 'Authority Command',
      path: '/authority',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      role: 'SUPERVISOR',
      label: 'Supervisor',
      path: '/supervisor',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
    },
    {
      role: 'WORKER',
      label: 'Sanitation Worker',
      path: '/worker',
      icon: <HardHat className="w-3.5 h-3.5" />,
    },
    {
      role: 'CITIZEN',
      label: 'Citizen Portal',
      path: '/citizen',
      icon: <Users className="w-3.5 h-3.5" />,
    },
  ];

  const handleRoleChange = (targetRole: UserRole, targetPath: string) => {
    setCurrentRole(targetRole);
    // Navigate only if not already under this section
    const prefix = `/${targetRole.toLowerCase()}`;
    if (!location.pathname.startsWith(prefix)) {
      navigate(targetPath);
    }
  };

  return (
    <div className="bg-[#E9E6DF] border-b border-[rgba(26,26,24,0.15)] text-[#1A1A18] text-xs py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6B64]">
            Active Role:
          </span>
          <span className="font-serif italic font-medium text-[#1A1A18]">
            {currentRole === 'AUTHORITY' && 'Municipal Operations Authority'}
            {currentRole === 'SUPERVISOR' && 'Field Ward Supervisor'}
            {currentRole === 'WORKER' && 'Sanitation Response Team'}
            {currentRole === 'CITIZEN' && 'Public Resident'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#6E6B64] mr-1 hidden sm:inline">Switch Experience:</span>
          <div className="flex items-center bg-[#F3F1EC] p-0.5 rounded-md border border-[rgba(26,26,24,0.12)]">
            {roles.map((r) => {
              const isActive = currentRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleChange(r.role, r.path)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1A1A18] text-[#F3F1EC] font-medium shadow-xs'
                      : 'text-[#6E6B64] hover:text-[#1A1A18] hover:bg-[#E9E6DF]'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
