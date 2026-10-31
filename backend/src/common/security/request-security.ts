import { createHash } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import type { INestApplication } from '@nestjs/common';

export const limitMessage = {
  success: false,
  data: null,
  message: 'Demasiados intentos. Intente más tarde.',
};

export function configureCorsAndRateLimits(app: INestApplication) {
  // CORS must precede every limiter so browsers can read 429 responses.
  // It also completes OPTIONS preflights before they consume request limits.
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',').map((origin) =>
      origin.trim(),
    ) || [
      'http://localhost:5173',
      'https://webarco-dental-estudio.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const options = {
    standardHeaders: 'draft-8' as const,
    legacyHeaders: false,
    message: limitMessage,
  };
  app.use('/auth', rateLimit({ ...options, windowMs: 15 * 60000, limit: 30 }));
  app.use(
    '/auth/login',
    rateLimit({
      ...options,
      windowMs: 15 * 60000,
      limit: 10,
      skipSuccessfulRequests: true,
    }),
  );
  app.use('/webhooks', rateLimit({ ...options, windowMs: 60000, limit: 30 }));
  app.use('/upload', rateLimit({ ...options, windowMs: 60000, limit: 60 }));
}

export function loginAccountLimiter() {
  return rateLimit({
    windowMs: 15 * 60000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
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
