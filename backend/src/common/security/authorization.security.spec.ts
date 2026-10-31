import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { AuthService } from '../../auth/auth.service';
import { PrivilegesGuard } from '../../guards/privileges.guard';
import { FinanzasController } from '../../finanzas/finanzas.controller';
import { ReminderService } from '../../reminder/reminder.service';
import { credentialVersion } from './credential-version';
import { generateRefreshToken } from '../../utils/jwt/generateToken';

describe('Authorization and replay regressions', () => {
  const originalEnv = { ...process.env };
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-bytes';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-with-at-least-32-bytes';
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  it('denies inventory-only access to the financial report', async () => {
    const prisma = {
      usuario: { findUnique: async () => ({ activo: true, id_rol: 4 }) },
      rolPrivilegio: { findMany: async () => [{ id_privilegio: 63 }] },
    };
    const guard = new PrivilegesGuard(new Reflector(), prisma as any);
    const req = { user: { id_usuario: 1 } };
    const context = {
      getHandler: () => FinanzasController.prototype.getEstadoResultado,
      getClass: () => FinanzasController,
      switchToHttp: () => ({ getRequest: () => req }),
    };
    expect(await guard.canActivate(context as any)).toBe(false);
    prisma.rolPrivilegio.findMany = async () => [{ id_privilegio: 2 }];
    expect(await guard.canActivate(context as any)).toBe(true);
  });
  it('denies endpoints without privilege metadata', async () => {
    const guard = new PrivilegesGuard(new Reflector(), {} as any);
    expect(
      await guard.canActivate({
        getHandler: () => () => undefined,
        getClass: () => class {},
      } as any),
    ).toBe(false);
  });
  it('rotates refresh tokens and rejects replay of the old token', async () => {
    const user = {
      id_usuario: 1,
      id_rol: 2,
      username: 'test',
      activo: true,
      password: 'hash',
    };
    const refresh = generateRefreshToken({
      sub: 1,
      id_rol: 2,
      username: user.username,
      sid: 'session',
      cv: credentialVersion(user.password),
    });
    let hash = createHash('sha256').update(refresh).digest('hex');
    const prisma = {
      usuario: { findUnique: async () => user },
      authSession: {
        findUnique: async () => ({
          id: 'session',
          id_usuario: 1,
          expiresAt: new Date(Date.now() + 60000),
          revokedAt: null,
        }),
        updateMany: async ({ where, data }: any) => {
          if (where.refreshHash !== hash) return { count: 0 };
          hash = data.refreshHash;
          return { count: 1 };
        },
      },
    };
    const auth = new AuthService(prisma as any, {} as any);
    const result = await auth.refreshToken(refresh);
    expect(result.refresh_token).not.toBe(refresh);
    await expect(auth.refreshToken(refresh)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(
      (await auth.refreshToken(result.refresh_token)).access_token,
    ).toBeTruthy();
  });
  it('revokes the persisted session on logout', async () => {
    const updateMany = jest.fn(async () => ({ count: 1 }));
    await new AuthService(
      { authSession: { updateMany } } as any,
      {} as any,
    ).logout('session');
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'session', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
  it('rejects email tokens with a different appointment/action, expiration, or prior use', async () => {
    const token = 'a'.repeat(64);
    const row = {
      citaId: 1,
      action: 'Confirmo',
      usedAt: null as Date | null,
      expiresAt: new Date(Date.now() + 60000),
    };
    const service = new ReminderService(
      { emailResponseToken: { findUnique: async () => row } } as any,
      {} as any,
      {} as any,
    );
    expect(await service.validateEmailToken(1, 'Confirmo', token)).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    await expect(
      service.validateEmailToken(2, 'Confirmo', token),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.validateEmailToken(1, 'Cancelo', token),
    ).rejects.toBeInstanceOf(BadRequestException);
    row.usedAt = new Date();
    await expect(
      service.validateEmailToken(1, 'Confirmo', token),
    ).rejects.toBeInstanceOf(BadRequestException);
    row.usedAt = null;
    row.expiresAt = new Date(0);
    await expect(
      service.validateEmailToken(1, 'Confirmo', token),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('aborts email mutation when another request already consumed the token', async () => {
    const tx = {
      emailResponseToken: { updateMany: jest.fn(async () => ({ count: 0 })) },
      cita: { updateMany: jest.fn() },
    };
    const prisma = {
      emailResponseToken: {
        findUnique: async () => ({
          citaId: 1,
          action: 'Confirmo',
          usedAt: null,
          expiresAt: new Date(Date.now() + 60000),
        }),
      },
      $transaction: async (callback: any) => callback(tx),
    };
    const service = new ReminderService(prisma as any, {} as any, {} as any);
    await expect(
      service.handleEmailResponse(1, 'Confirmo', 'a'.repeat(64)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.cita.updateMany).not.toHaveBeenCalled();
  });
});
