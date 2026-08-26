/**
 * Formato legible de descansos (SPEC-009).
 * Ej.: 90 → "90 s", 120 → "2 min".
 */
export function formatRestSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0 s";
  }

  const whole = Math.floor(seconds);
  if (whole >= 60 && whole % 60 === 0) {
    return `${whole / 60} min`;
  }

  return `${whole} s`;
}
