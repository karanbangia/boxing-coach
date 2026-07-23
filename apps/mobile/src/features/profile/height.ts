export const CENTIMETRES_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;

// Rounded outward from documented adult human records and aligned with the
// whole-inch range of 1′9″–9′0″.
export const MIN_HEIGHT_CM = 53;
export const MAX_HEIGHT_CM = 274;
export const MIN_HEIGHT_INCHES = 21;
export const MAX_HEIGHT_INCHES = 108;

export function clampHeightCm(value: number) {
  return Math.max(MIN_HEIGHT_CM, Math.min(MAX_HEIGHT_CM, Math.round(value)));
}

export function clampHeightInches(value: number) {
  return Math.max(
    MIN_HEIGHT_INCHES,
    Math.min(MAX_HEIGHT_INCHES, Math.round(value)),
  );
}

export function centimetresToRoundedInches(value: number) {
  return Math.round(value / CENTIMETRES_PER_INCH);
}

export function inchesToCentimetres(value: number) {
  return value * CENTIMETRES_PER_INCH;
}

export function splitFeetAndInches(value: number) {
  const totalInches = Math.max(0, Math.round(value));
  return {
    feet: Math.floor(totalInches / INCHES_PER_FOOT),
    inches: totalInches % INCHES_PER_FOOT,
  };
}

export function formatFeetAndInches(value: number) {
  const { feet, inches } = splitFeetAndInches(value);
  return `${feet}′${inches}″`;
}

export function formatFeetAndInchesAccessible(value: number) {
  const { feet, inches } = splitFeetAndInches(value);
  return `${feet} ${feet === 1 ? 'foot' : 'feet'} ${inches} ${inches === 1 ? 'inch' : 'inches'}`;
}
