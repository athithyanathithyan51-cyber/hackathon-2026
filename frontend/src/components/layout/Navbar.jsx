import { Menu } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { NAV_SECTIONS } from '../../constants/navigation';
import { useProject } from '../../context/ProjectContext';

export default function Navbar({
  activeSection,
  onOpenMobile,
  onResetDemo
}) {
  const currentNav = NAV_SECTIONS.find(item => item.id === activeSection) || NAV_SECTIONS[0];
  const { activeFile, isBackendOnline } = useProject();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Section title & breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>LegacyIQ</span>
            <span>/</span>
            <span>Banking Core</span>
            <span>/</span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            {currentNav.label}
            {currentNav.badge && (
              <Badge variant="info" size="xs">
                {currentNav.badge}
              </Badge>
            )}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Modernization Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="font-medium text-slate-700">
            {isBackendOnline ? 'Live Engine' : 'Offline Mode'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono">{activeFile?.name || 'PENALTY.cbl'}</span>
        </div>

        {/* Demo reset / reload button */}
        <Button
          variant="secondary"
          size="xs"
          onClick={onResetDemo}
        >
          Reset Demo
        </Button>
      </div>
    </header>
  );
}
