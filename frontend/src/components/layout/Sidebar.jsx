import { NAV_SECTIONS } from '../../constants/navigation';
import { useProject } from '../../context/ProjectContext';

export default function Sidebar({
  activeSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile
}) {
  const { activeFile, isBackendOnline } = useProject();
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container - White-Primary, Soft-Neutral, Eye-Comfortable */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white text-slate-700 flex flex-col border-r border-slate-200 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-200 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shrink-0 shadow-xs">
            IQ
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm tracking-tight">LegacyIQ</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200 font-semibold">
                COBOL → Java
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">Modernization Assistant</p>
          </div>
        </div>

        {/* Target Project / File Chip */}
        <div className="px-3 pt-3 pb-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="uppercase tracking-wider font-semibold">Active Scope</span>
              <span className={`inline-flex items-center gap-1 font-medium ${isBackendOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isBackendOnline ? 'Live Engine' : 'Offline'}
              </span>
            </div>
            <div className="text-slate-900 font-semibold font-mono text-[11px] truncate">
              {activeFile?.name || 'PENALTY.cbl'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              Target: Java 21 + Spring Boot 3.x
            </div>
          </div>
        </div>

        {/* Navigation list - Text-first, clean, information-focused */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            Navigation
          </div>

          {NAV_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  onSelectSection(section.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate">{section.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {section.description.split(',')[0]}
                  </div>
                </div>

                {section.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    {section.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 bg-slate-50/50">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-slate-600">Banking Edition</span>
            <span className="font-mono text-slate-400">v1.2 MVP</span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            Verify before modernizing.
          </div>
        </div>
      </aside>
    </>
  );
}
