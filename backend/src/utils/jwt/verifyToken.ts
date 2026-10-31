import { verify, VerifyOptions, decode } from 'jsonwebtoken';

export interface TokenPayload {
  sub: number;
  username: string;
  email?: string | null;
  id_rol: number;
  sid?: string;
  cv?: string;
}

export function verifyToken(token: string): TokenPayload {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado');
  }
  const secret = process.env.JWT_SECRET;
  const options: VerifyOptions = { algorithms: ['HS256'] };

  return verify(token, secret, options) as unknown as TokenPayload;
}

export const verifyResetToken = (token: string, secret: string) => {
  return verify(token, secret);
};
export function decodeToken(token: string): TokenPayload {
  return decode(token) as unknown as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está configurado');
  }
  const secret = process.env.JWT_REFRESH_SECRET;
  const options: VerifyOptions = { algorithms: ['HS256'] };

  return verify(token, secret, options) as unknown as TokenPayload;
}
