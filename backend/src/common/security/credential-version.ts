import { createHmac } from 'crypto';
import { jwtSecret } from '../../utils/jwt/secrets';

// Never expose a password hash in the JWT. Changes invalidate all prior tokens.
export function credentialVersion(passwordHash: string): string {
  return createHmac('sha256', jwtSecret('JWT_SECRET'))
    .update(passwordHash)
    .digest('hex');
}
