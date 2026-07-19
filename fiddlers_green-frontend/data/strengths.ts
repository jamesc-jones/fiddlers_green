export const STRENGTHS = [
  "1000mg",
  "2500mg",
  "5000mg",
  "7500mg",
  "10000mg",
  "15000mg",
] as const;

export type Strength = (typeof STRENGTHS)[number];
