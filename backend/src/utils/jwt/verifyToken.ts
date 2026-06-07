import { verify, VerifyOptions, decode } from 'jsonwebtoken';

export interface TokenPayload {
  sub: number;
  username: string;
  email?: string | null;
  id_rol: number;
}

export function verifyToken(token: string): TokenPayload {

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const options: VerifyOptions = {};

  return verify(token, secret, options) as unknown as TokenPayload;
}

export const verifyResetToken = (token: string, secret: string) => {
  return verify(token, secret);
};
export function decodeToken(token: string): TokenPayload {
  return decode(token) as unknown as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  const options: VerifyOptions = {};

  return verify(token, secret, options) as unknown as TokenPayload;
}


