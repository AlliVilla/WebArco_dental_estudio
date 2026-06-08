import { sign, SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  sub: number;
  username: string;
  email?: string | null;
  id_rol: number;
}

export function generateToken(
  payload: TokenPayload,
  expiresIn: string | number = '24h',
  secretKey?: string
): string {
  let secret = secretKey
  
  if(!secret){
    secret = process.env.JWT_SECRET || 'your-secret-key';
  }

  return sign(payload, secret, { expiresIn } as SignOptions);
}

export function generateRefreshToken(
  payload: TokenPayload,
  expiresIn: string | number = '7d',
): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

  return sign(payload, secret, { expiresIn } as SignOptions);
}



