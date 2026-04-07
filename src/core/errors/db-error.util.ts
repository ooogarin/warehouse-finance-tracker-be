type DatabaseErrorShape = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
};

const toDatabaseError = (error: unknown): DatabaseErrorShape | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  return error as DatabaseErrorShape;
};

export const isUniqueViolation = (error: unknown): boolean => {
  return toDatabaseError(error)?.code === '23505';
};

export const isForeignKeyViolation = (error: unknown): boolean => {
  return toDatabaseError(error)?.code === '23503';
};

export const hasDatabaseErrorText = (error: unknown, hints: string[]): boolean => {
  const dbError = toDatabaseError(error);
  if (!dbError) {
    return false;
  }

  const text = [dbError.constraint, dbError.detail, dbError.message].filter(Boolean).join(' ').toLowerCase();
  return hints.some((hint) => text.includes(hint.toLowerCase()));
};
