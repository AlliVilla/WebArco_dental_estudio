import {
  loginAccountLimiter,
  verifyCookieOrigin,
} from './common/security/request-security';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { jwtSecret } from './utils/jwt/secrets';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import express from 'express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  jwtSecret('JWT_SECRET');
  jwtSecret('JWT_REFRESH_SECRET');
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.CORS_ORIGINS || !process.env.FRONTEND_URL)
  )
    throw new Error(
      'CORS_ORIGINS y FRONTEND_URL son obligatorios en producción',
    );
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const server = app.getHttpAdapter().getInstance();
  server.disable('x-powered-by');
  // Configure only known proxy addresses/CIDRs; never blindly trust forwarded headers.
  if (process.env.TRUSTED_PROXY_CIDRS)
    server.set(
      'trust proxy',
      process.env.TRUSTED_PROXY_CIDRS.split(',').map((s) => s.trim()),
    );
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  const error429 = {
    success: false,
    data: null,
    message: 'Demasiados intentos. Intente más tarde.',
  };
  app.use(
    '/auth',
    rateLimit({
      windowMs: 15 * 60000,
      limit: 30,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: error429,
    }),
  );
  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 15 * 60000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: error429,
    }),
  );
  app.use(
    '/webhooks',
    rateLimit({
      windowMs: 60000,
      limit: 30,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: error429,
    }),
  );
  app.use(
    '/upload',
    rateLimit({
      windowMs: 60000,
      limit: 60,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: error429,
    }),
  );
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
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(verifyCookieOrigin);
  app.use('/auth/login', loginAccountLimiter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WebArco Dental Studio API')
      .setDescription('API del sistema de gestión dental')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
      '/reference',
      apiReference({
        spec: { content: document },
      }),
    );
  }
  // Documentation remains disabled in production.
  await app.listen(process.env.PORT ?? 3030);
}
void bootstrap();
