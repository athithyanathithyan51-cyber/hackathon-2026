const VARIANTS = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  outline: 'bg-transparent text-slate-600 border-slate-300'
};

const DOT_COLORS = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  purple: 'bg-purple-500',
  neutral: 'bg-slate-400',
  outline: 'bg-slate-400'
};

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'sm', 
  dot = false,
  className = '' 
}) {
  const sizeClasses = size === 'xs' 
    ? 'px-1.5 py-0.5 text-[11px]' 
    : size === 'md'
    ? 'px-2.5 py-1 text-xs'
    : 'px-2 py-0.5 text-xs';

  const variantClass = VARIANTS[variant] || VARIANTS.neutral;
  const dotColorClass = DOT_COLORS[variant] || DOT_COLORS.neutral;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${variantClass} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />}
      {children}
    </span>
  );
}
