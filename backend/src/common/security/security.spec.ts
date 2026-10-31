import { UsuarioController } from '../../usuario/usuario.controller';
import { UsuarioService } from '../../usuario/usuario.service';
import { Prisma } from '@prisma/client';
import express from 'express';
import cookieParser from 'cookie-parser';
import { loginAccountLimiter, verifyCookieOrigin } from './request-security';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { sign } from 'jsonwebtoken';
import { UploadController } from '../../upload/upload.controller';
import { UploadService } from '../../upload/upload.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../../guards/privileges.guard';
import { MulterModule } from '@nestjs/platform-express';
import {
  privateUploadOptions,
  imageType,
  safeFilename,
} from '../../upload/private-storage';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { AllExceptionsFilter } from '../filters/http-exception.filter';
import { credentialVersion } from './credential-version';
import { safeOutput } from './safe-output';
import { jwtSecret } from '../../utils/jwt/secrets';
import { ReminderWebhookController } from '../../reminder/reminder.webhook.controller';
import { ReminderService } from '../../reminder/reminder.service';
import { getExpectedTwilioSignature } from 'twilio';

describe('Security regressions (no database or outbound services)', () => {
  let app: INestApplication;
  const originalEnv = { ...process.env };
  const user = {
    id_usuario: 1,
    id_rol: 2,
    activo: true,
    must_change_password: false,
    password: 'test-password-hash',
  };
  const session = {
    id: 'test-session',
    usuario: user,
    revokedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 60000),
  };
  const prisma = {
    authSession: { findUnique: jest.fn(async () => session) },
    usuario: { findUnique: jest.fn(async () => user) },
    rolPrivilegio: {
      findMany: jest.fn(async () => [
        { id_privilegio: 9 },
        { id_privilegio: 20 },
        { id_privilegio: 21 },
      ]),
    },
    consulta: { findFirst: jest.fn(async () => null) },
    archivo: { findFirst: jest.fn(async () => null) },
    storedUpload: { findUnique: jest.fn(async () => null) },
  };
  const reminders = {
    handleTwilioWebhook: jest.fn(),
    validateEmailToken: jest.fn(),
    handleEmailResponse: jest.fn(),
  };
  const token = () =>
    sign(
      { sub: 1, sid: session.id, cv: credentialVersion(user.password) },
      process.env.JWT_SECRET!,
      { expiresIn: '1m' },
    );

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-bytes';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-with-at-least-32-bytes';
    const module = await Test.createTestingModule({
      imports: [MulterModule.register(privateUploadOptions)],
      controllers: [
        UploadController,
        ReminderWebhookController,
        UsuarioController,
      ],
      providers: [
        {
          provide: UsuarioService,
          useValue: {
            changeAuthenticatedPassword: jest.fn(),
            getAuthenticatedProfile: jest.fn(async () => ({
              username: 'test',
            })),
          },
        },
        UploadService,
        JwtStrategy,
        JwtAuthGuard,
        PrivilegesGuard,
        { provide: PrismaService, useValue: prisma },
        { provide: ReminderService, useValue: reminders },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(express.json());
    app.use(cookieParser());
    app.use(verifyCookieOrigin);
    app.use('/auth/login', loginAccountLimiter());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });
  beforeEach(() => {
    user.activo = true;
    user.must_change_password = false;
    session.revokedAt = null;
    jest.clearAllMocks();
  });

  it('rejects anonymous reads and uploads before handling files', async () => {
    await request(app.getHttpServer()).get('/upload/example.png').expect(401);
    await request(app.getHttpServer())
      .post('/upload/single')
      .attach('file', Buffer.from('test'), 'x.png')
      .expect(401);
  });
  it.each([
    '..%2fpackage.json',
    '..%5cpackage.json',
    '%252e%252e%252fsecret.png',
    '.env',
    'C:%5csecret.png',
  ])('rejects traversal %s', async (name) => {
    await request(app.getHttpServer())
      .get(`/upload/${name}`)
      .auth(token(), { type: 'bearer' })
      .expect(400);
    expect(prisma.archivo.findFirst).not.toHaveBeenCalled();
  });
  it('rejects disguised HTML independently of client MIME and extension', async () => {
    const result = await request(app.getHttpServer())
      .post('/upload/single')
      .auth(token(), { type: 'bearer' })
      .attach('file', Buffer.from('<html><script>alert(1)</script></html>'), {
        filename: 'x.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(result.body).toMatchObject({ success: false, data: null });
  });
  it('enforces the five megabyte limit before persistence', async () => {
    await request(app.getHttpServer())
      .post('/upload/single')
      .auth(token(), { type: 'bearer' })
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.png')
      .expect(413);
  });
  it('rejects disabled accounts and revoked sessions', async () => {
    user.activo = false;
    await request(app.getHttpServer())
      .get('/upload/example.png')
      .auth(token(), { type: 'bearer' })
      .expect(401);
    user.activo = true;
    session.revokedAt = new Date();
    await request(app.getHttpServer())
      .get('/upload/example.png')
      .auth(token(), { type: 'bearer' })
      .expect(401);
  });
  it('rejects tokens issued before password changes', async () => {
    const old = token();
    const previous = user.password;
    user.password = 'new-password-hash';
    await request(app.getHttpServer())
      .get('/upload/example.png')
      .auth(old, { type: 'bearer' })
      .expect(401);
    user.password = previous;
  });
  it('enforces mandatory password changes in the backend', async () => {
    user.must_change_password = true;
    await request(app.getHttpServer())
      .get('/upload/example.png')
      .auth(token(), { type: 'bearer' })
      .expect(403);
  });
  it('allows the required password-change endpoint during mandatory changes', async () => {
    user.must_change_password = true;
    await request(app.getHttpServer())
      .put('/usuario/profile/change-password')
      .auth(token(), { type: 'bearer' })
      .send({
        currentPassword: 'OldPassword1!',
        newPassword: 'NewPassword2!',
        confirmPassword: 'NewPassword2!',
      })
      .expect(200);
  });
  it('does not reveal other users staged files', async () => {
    await request(app.getHttpServer())
      .get('/upload/example.png')
      .auth(token(), { type: 'bearer' })
      .expect(403);
  });
  it('does not serve legacy static paths', async () => {
    await request(app.getHttpServer()).get('/uploads/example.png').expect(404);
    await request(app.getHttpServer()).get('/static/example.png').expect(404);
  });
  it('rejects unsigned Twilio callbacks', async () => {
    process.env.ENABLE_TWILIO_WEBHOOK = 'true';
    process.env.TWILIO_AUTH_TOKEN = 'test-twilio-secret';
    process.env.TWILIO_WEBHOOK_URL = 'https://example.test/webhooks/twilio';
    await request(app.getHttpServer())
      .post('/webhooks/twilio')
      .type('form')
      .send({ From: 'whatsapp:+50499999999', Body: 'SI' })
      .expect(403);
    expect(reminders.handleTwilioWebhook).not.toHaveBeenCalled();
  });
  it('accepts a correctly signed form webhook and rejects tampering', async () => {
    const body = { From: 'whatsapp:+50499999999', Body: 'SI' };
    const signature = getExpectedTwilioSignature(
      process.env.TWILIO_AUTH_TOKEN!,
      process.env.TWILIO_WEBHOOK_URL!,
      body,
    );
    await request(app.getHttpServer())
      .post('/webhooks/twilio')
      .set('X-Twilio-Signature', signature)
      .type('form')
      .send(body)
      .expect(200);
    expect(reminders.handleTwilioWebhook).toHaveBeenCalledWith(
      body.From,
      body.Body,
    );
    reminders.handleTwilioWebhook.mockClear();
    await request(app.getHttpServer())
      .post('/webhooks/twilio')
      .set('X-Twilio-Signature', signature)
      .type('form')
      .send({ ...body, Body: 'NO' })
      .expect(403);
    expect(reminders.handleTwilioWebhook).not.toHaveBeenCalled();
  });
  it('email GET does not mutate the appointment', async () => {
    const value = 'a'.repeat(64);
    await request(app.getHttpServer())
      .get(`/webhooks/email-response/1?action=Confirmo&token=${value}`)
      .expect(200);
    expect(reminders.validateEmailToken).toHaveBeenCalledWith(
      1,
      'Confirmo',
      value,
    );
    expect(reminders.handleEmailResponse).not.toHaveBeenCalled();
  });

  it('limits repeated login attempts by account', async () => {
    for (let i = 0; i < 10; i++)
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'same-account' })
        .expect(404);
    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'SAME-ACCOUNT' })
      .expect(429);
    expect(result.body).toMatchObject({ success: false, data: null });
  });
  it('rejects cross-origin cookie mutations while permitting configured origins', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Cookie', 'refresh_token=test')
      .set('Origin', 'https://attacker.test')
      .send({ username: 'csrf' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Cookie', 'refresh_token=test')
      .set('Origin', 'http://localhost:5173')
      .send({ username: 'csrf' })
      .expect(404);
  });
  it('removes password hashes in nested relations', () => {
    expect(
      safeOutput({
        doctor: { password: 'hash', username: 'doctor' },
        users: [{ password: 'hash' }],
      }),
    ).toEqual({ doctor: { username: 'doctor' }, users: [{}] });
  });
  it('preserves financial Decimal serialization', () => {
    expect(
      JSON.stringify(safeOutput({ total: new Prisma.Decimal('123.45') })),
    ).toBe('{"total":"123.45"}');
  });
  it('fails closed for missing or equal JWT secrets', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => jwtSecret('JWT_SECRET')).toThrow();
    process.env.JWT_SECRET = process.env.JWT_REFRESH_SECRET;
    expect(() => jwtSecret('JWT_SECRET')).toThrow();
    process.env.JWT_SECRET = original;
  });
  it('generates types from binary signatures and rejects paths', () => {
    expect(imageType(Buffer.from('89504e470d0a1a0a', 'hex')).ext).toBe('png');
    expect(() => imageType(Buffer.from('<svg/>'))).toThrow();
    expect(() => safeFilename('../x.png')).toThrow();
  });
});
