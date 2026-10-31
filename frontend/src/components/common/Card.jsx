export default function Card({
  children,
  title,
  subtitle,
  badge,
  actions,
  className = '',
  bodyClassName = 'p-5',
  headerClassName = 'px-5 py-4 border-b border-slate-100',
  footer,
  footerClassName = 'px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl',
  noPadding = false
}) {
  const hasHeader = title || subtitle || badge || actions;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300/80 transition-colors ${className}`}>
      {hasHeader && (
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div>
              {title && (
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
                  {badge}
                </div>
              )}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : bodyClassName}>
        {children}
      </div>
      {footer && (
        <div className={footerClassName}>
          {footer}
        </div>
      )}
    </div>
  );
}
