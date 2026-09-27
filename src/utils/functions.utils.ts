/** Duration shorthand accepted by both `ms` (used by @nestjs/jwt) and the parser below. */
export type DurationString = `${number}${'s' | 'm' | 'h' | 'd'}`;

export function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return parseInt(duration, 10); // fallback

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return value;
  }
}
