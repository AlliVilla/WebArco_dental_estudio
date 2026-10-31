import {
  Controller,
  HttpCode,
  INestApplication,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  configureCorsAndRateLimits,
  loginAccountLimiter,
} from './request-security';

@Controller('auth')
class TestAuthController {
  @Post('login')
  @HttpCode(200)
  login() {
    throw new UnauthorizedException('Credenciales incorrectas');
  }
}

@Controller('auth')
class SuccessfulAuthController {
  @Post('login')
  @HttpCode(200)
  login() {
    return { accepted: true };
  }
}

describe('CORS and authentication rate limits', () => {
  let app: INestApplication;
  const origin = 'http://localhost:5173';
  const previousOrigins = process.env.CORS_ORIGINS;
  beforeEach(() => {
    process.env.CORS_ORIGINS = origin;
  });
  afterEach(async () => {
    if (app) await app.close();
    if (previousOrigins === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = previousOrigins;
  });
  async function createApp(
    controller: typeof TestAuthController | typeof SuccessfulAuthController,
  ) {
    const module = await Test.createTestingModule({
      controllers: [controller],
    }).compile();
    app = module.createNestApplication();
    configureCorsAndRateLimits(app);
    app.use('/auth/login', loginAccountLimiter());
    await app.init();
    return app.getHttpServer();
  }
  it('does not consume login limits with preflight requests', async () => {
    const server = await createApp(TestAuthController);
    for (let i = 0; i < 12; i++) {
      await request(server)
        .options('/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);
    }
    await request(server).post('/auth/login').set('Origin', origin).expect(401);
  });
  it('returns browser-readable 429 and still permits preflight while blocked', async () => {
    const server = await createApp(TestAuthController);
    for (let i = 0; i < 10; i++)
      await request(server)
        .post('/auth/login')
        .set('Origin', origin)
        .expect(401);
    const response = await request(server)
      .post('/auth/login')
      .set('Origin', origin)
      .expect(429);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(response.body).toMatchObject({ success: false, data: null });
    await request(server)
      .options('/auth/login')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);
  });
  it('does not count successful logins toward either failed-login limit', async () => {
    const server = await createApp(SuccessfulAuthController);
    for (let i = 0; i < 15; i++)
      await request(server)
        .post('/auth/login')
        .set('Origin', origin)
        .expect(200);
  });
});
