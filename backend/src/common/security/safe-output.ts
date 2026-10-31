// Defense in depth for nested Prisma relations. Services must also use safe selects.
export function safeOutput(value: unknown): any {
  if (Array.isArray(value)) return value.map(safeOutput);
  if (
    !value ||
    typeof value !== 'object' ||
    value instanceof Date ||
    Buffer.isBuffer(value)
  )
    return value;
  // Preserve serializers such as Prisma.Decimal.toJSON(). Only traverse records.
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !['password', 'refreshHash', 'credentialVersion'].includes(key),
      )
      .map(([key, child]) => [key, safeOutput(child)]),
  );
}
