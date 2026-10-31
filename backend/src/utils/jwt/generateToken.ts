import { randomUUID } from 'crypto';
import { jwtSecret } from './secrets';
import { sign, SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  sub: number;
  username: string;
  email?: string | null;
  id_rol: number;
  sid?: string;
  cv?: string;
}

export function generateToken(
  payload: TokenPayload,
  expiresIn: string | number = '15m',
  secretKey?: string,
): string {
  let secret = secretKey;

  if (!secret) {
    secret = jwtSecret('JWT_SECRET');
  }

  return sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256',
    jwtid: randomUUID(),
  } as SignOptions);
}

export function generateRefreshToken(
  payload: TokenPayload,
  expiresIn: string | number = '7d',
): string {
  const secret = jwtSecret('JWT_REFRESH_SECRET');

  return sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256',
    jwtid: randomUUID(),
  } as SignOptions);
}
