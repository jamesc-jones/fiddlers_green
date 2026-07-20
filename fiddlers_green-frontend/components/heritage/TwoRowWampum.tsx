export default function TwoRowWampum() {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl md:text-4xl text-brand-cream">
          The Two Row Wampum
        </h2>
        <p className="mt-6 text-base md:text-lg text-brand-smoke leading-relaxed">
          Two vessels travel side by side on the river of life — neither steering
          the other&apos;s course, neither imposing its laws upon the other. This is
          the covenant of peace, friendship, and mutual respect passed down
          through generations.
        </p>
      </div>
      <div className="aspect-video w-full rounded-sm border border-brand-gold/30 bg-brand-charcoal" />
    </div>
  );
}
