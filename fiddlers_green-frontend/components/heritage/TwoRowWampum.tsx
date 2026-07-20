const ROWS = 5;
const COLS = 18;
const PURPLE_ROWS = new Set([1, 3]);

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 110;
const MARGIN_X = 14;
const MARGIN_Y = 14;
const BEAD_RADIUS = 4;

const SPACING_X = (VIEW_WIDTH - MARGIN_X * 2) / (COLS - 1);
const SPACING_Y = (VIEW_HEIGHT - MARGIN_Y * 2) / (ROWS - 1);

const BEADS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLS }, (_, col) => ({
    row,
    col,
    cx: MARGIN_X + col * SPACING_X,
    cy: MARGIN_Y + row * SPACING_Y,
    isPurple: PURPLE_ROWS.has(row),
  }))
).flat();

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
      <div className="aspect-video w-full overflow-hidden rounded-sm border border-white/10">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="h-full w-full"
          role="img"
          aria-label="Two Row Wampum belt pattern"
        >
          <rect x={0} y={0} width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="#f5f0e8" />
          {BEADS.map((bead) => (
            <circle
              key={`${bead.row}-${bead.col}`}
              cx={bead.cx}
              cy={bead.cy}
              r={BEAD_RADIUS}
              fill={bead.isPurple ? "#4b2e5a" : "#ffffff"}
              stroke={bead.isPurple ? "none" : "#e4ddce"}
              strokeWidth={0.5}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
