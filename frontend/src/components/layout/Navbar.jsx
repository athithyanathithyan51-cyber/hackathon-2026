import { Menu, RefreshCw } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { NAV_SECTIONS } from '../../constants/navigation';

export default function Navbar({
  activeSection,
  onOpenMobile,
  onResetDemo
}) {
  const currentNav = NAV_SECTIONS.find(item => item.id === activeSection) || NAV_SECTIONS[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
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
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            {currentNav.label}
            {currentNav.highlight && (
              <Badge variant="purple" size="xs">
                {currentNav.badge}
              </Badge>
            )}
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Evidence Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-700">Evidence Store: Active</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono">14 Rules Grounded</span>
        </div>

        {/* Demo reset / reload button */}
        <Button
          variant="secondary"
          size="xs"
          icon={RefreshCw}
          onClick={onResetDemo}
          title="Reset demonstration state to baseline"
        >
          <span className="hidden sm:inline">Reset State</span>
        </Button>

        {/* Team Hackathon Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-semibold text-xs border border-slate-300 shadow-2xs">
            IQ
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Team LegacyIQ</div>
            <div className="text-[10px] text-slate-400 leading-tight">TCS Hackathon 2026</div>
          </div>
        </div>
      </div>
    </header>
  );
}
