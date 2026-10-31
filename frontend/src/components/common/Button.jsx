const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500 border border-transparent',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs focus-visible:ring-slate-400',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500 border border-transparent',
  subtle: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
};

const SIZES = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-2.5 py-1.5 text-xs font-medium gap-1.5',
  md: 'px-3.5 py-2 text-sm font-medium gap-2',
  lg: 'px-4 py-2.5 text-sm font-medium gap-2'
};

export default function Button({
  children,
  variant = 'secondary',
  size = 'sm',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  title
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.secondary;
  const sizeClass = SIZES[size] || SIZES.sm;
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-[0.99]';

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 select-none ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
