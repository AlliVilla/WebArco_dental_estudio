export function jwtSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name];
  if (
    !value ||
    Buffer.byteLength(value) < 32 ||
    /your-.*secret|changeme/i.test(value)
  ) {
    throw new Error(
      `${name} debe contener un secreto aleatorio de al menos 32 bytes`,
    );
  }
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('Los secretos de acceso y renovación deben ser diferentes');
  }
  return value;
}
