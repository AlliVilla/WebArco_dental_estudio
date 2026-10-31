import { createHash } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

export const limitMessage = {
  success: false,
  data: null,
  message: 'Demasiados intentos. Intente más tarde.',
};

export function loginAccountLimiter() {
  return rateLimit({
    windowMs: 15 * 60000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) =>
      createHash('sha256')
        .update(
          String(req.body?.username || '')
            .trim()
            .toLowerCase(),
        )
        .digest('hex'),
    message: limitMessage,
  });
}

export function verifyCookieOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim());
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    (req.cookies?.auth_token || req.cookies?.refresh_token) &&
    !req.headers.authorization &&
    (!req.headers.origin || !allowed.includes(req.headers.origin))
  ) {
    res
      .status(403)
      .json({ success: false, data: null, message: 'Origen no autorizado' });
    return;
  }
  next();
}
