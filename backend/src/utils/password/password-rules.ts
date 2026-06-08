export type PasswordRuleError = {
  rule: string;
  message: string;
};

export function getPasswordRuleErrors(password: string): PasswordRuleError[] {
  const errors: PasswordRuleError[] = [];

  if (!password || password.length < 8) {
    errors.push({
      rule: 'min_length',
      message: 'La contraseña debe tener mínimo 8 caracteres.',
    });
  }

  if (!/[A-Z]/.test(password)) {
    errors.push({
      rule: 'uppercase',
      message: 'La contraseña debe incluir al menos una letra mayúscula.',
    });
  }

  if (!/[a-z]/.test(password)) {
    errors.push({
      rule: 'lowercase',
      message: 'La contraseña debe incluir al menos una letra minúscula.',
    });
  }

  if (!/[0-9]/.test(password)) {
    errors.push({
      rule: 'number',
      message: 'La contraseña debe incluir al menos un número.',
    });
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push({
      rule: 'symbol',
      message: 'La contraseña debe incluir al menos un símbolo.',
    });
  }

  return errors;
}