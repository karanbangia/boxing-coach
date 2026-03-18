export function formatClock(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function formatSeconds(seconds: number): string {
  return `${Math.max(0, Math.ceil(seconds))}`;
}
