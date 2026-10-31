const ERROR_NAMES = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'PrismaClientKnownRequestError',
  'PrismaClientUnknownRequestError',
  'PrismaClientInitializationError',
  'PrismaClientValidationError',
  'PrismaClientRustPanicError',
]);

// Log only diagnostic identifiers. Prisma messages/meta may contain SQL and input.
export function errorDiagnostic(exception: unknown): {
  name: string;
  code?: string;
  model?: string;
} {
  if (!(exception instanceof Error)) return { name: 'UnknownError' };
  const result: { name: string; code?: string; model?: string } = {
    name: ERROR_NAMES.has(exception.name) ? exception.name : 'Error',
  };
  const candidate = exception as Error & {
    code?: unknown;
    meta?: { modelName?: unknown };
  };
  if (typeof candidate.code === 'string' && /^P\d{4}$/.test(candidate.code)) {
    result.code = candidate.code;
    const model = candidate.meta?.modelName;
    if (
      typeof model === 'string' &&
      /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(model)
    ) {
      result.model = model;
    }
  }
  return result;
}
