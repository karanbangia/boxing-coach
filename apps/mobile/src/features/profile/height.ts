export const CENTIMETRES_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;

// A practical, inclusive range for youth and adult boxing profiles. Values
// outside it are more likely to be corrupt legacy data than intentional input.
export const MIN_HEIGHT_CM = 120;
export const MAX_HEIGHT_CM = 230;
export const MIN_HEIGHT_INCHES = 47;
export const MAX_HEIGHT_INCHES = 91;

export function isHeightCmInRange(value: number) {
  return value >= MIN_HEIGHT_CM && value <= MAX_HEIGHT_CM;
}

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
