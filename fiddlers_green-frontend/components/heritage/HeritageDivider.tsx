export default function HeritageDivider() {
  return (
    <div className="flex items-center justify-center gap-4 px-6 md:px-10" aria-hidden="true">
      <span className="h-px w-full max-w-xs bg-brand-gold/40" />
      <span className="h-2 w-2 rotate-45 border border-brand-gold bg-brand-gold/20" />
      <span className="h-px w-full max-w-xs bg-brand-gold/40" />
    </div>
  );
}
