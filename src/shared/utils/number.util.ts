// Convert number to normalized decimal string for DB numeric columns.
export const toDecimalString = (value: number, fractionDigits: number = 3): string => {
  return value.toFixed(fractionDigits);
};
