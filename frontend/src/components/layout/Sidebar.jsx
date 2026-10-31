import { Cpu, Database } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/navigation';

export default function Sidebar({
  activeSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">LegacyIQ</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Modernization Intelligence</p>
          </div>
        </div>

        {/* Target Workspace Chip */}
        <div className="px-3 pt-4 pb-2">
          <div className="px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-[10px] text-slate-400">Target Legacy System</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-white font-medium text-xs truncate">
              <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Core-Banking-v3.4</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            Core Modernization Suite
          </div>

          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                }`} />
                <span className="flex-1 truncate">{item.label}</span>

                {item.highlight ? (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wide ${
                    isActive 
                      ? 'bg-blue-700 text-blue-100 border border-blue-400/30' 
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  }`}>
                    {item.badge}
                  </span>
                ) : item.badge ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* System Health / Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Evidence Engine
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v1.2-live</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Mode</span>
              <span className="text-slate-300 font-medium">Adaptive Gated</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
