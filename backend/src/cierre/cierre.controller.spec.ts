import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CierreController } from './cierre.controller';
import { CierreService } from './cierre.service';
import { TipoCierre } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('CierreController', () => {
  let controller: CierreController;
  let service: jest.Mocked<CierreService>;

  const serviceMock = {
    createCierre: jest.fn(),
    previewCierre: jest.fn(),
    previewCierrePorFecha: jest.fn(),
    getHistorial: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CierreController],
      providers: [
        { provide: CierreService, useValue: serviceMock },
        { provide: PrismaService, useValue: {} }, // Mock mínimo
        { provide: Reflector, useValue: {} },     // Mock mínimo
      ],
    }).compile();

    controller = module.get<CierreController>(CierreController);
    service = module.get(CierreService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createCierre ─────────────────────────────────────────────────────────

  describe('createCierre', () => {
    const validReq = (overrides: Partial<{ id_usuario: number; sub: number }> = {}) => ({
      user: { id_usuario: 1, ...overrides },
    });

    it('lanza UnauthorizedException si req.user no tiene id_usuario ni sub', () => {
      expect(() => {
        controller.createCierre({ tipo: undefined }, { user: {} } as any);
      }).toThrow(UnauthorizedException);
      expect(service.createCierre).not.toHaveBeenCalled();
    });

    it('lanza UnauthorizedException si req.user es undefined', () => {
      expect(() => {
        controller.createCierre({ tipo: undefined }, { user: undefined } as any);
      }).toThrow(UnauthorizedException);
    });

    it('llama al service con userId de id_usuario y tipo Diario por defecto', async () => {
      serviceMock.createCierre.mockResolvedValue({ cierre: {}, message: 'ok' });

      await controller.createCierre({ tipo: undefined }, validReq() as any);

      expect(service.createCierre).toHaveBeenCalledWith(1, 'Diario' as TipoCierre);
    });

    it('llama al service con el tipo indicado en el query', async () => {
      serviceMock.createCierre.mockResolvedValue({ cierre: {}, message: 'ok' });

      await controller.createCierre({ tipo: 'Semanal' }, validReq() as any);

      expect(service.createCierre).toHaveBeenCalledWith(1, 'Semanal' as TipoCierre);
    });

    it('usa req.user.sub como fallback cuando id_usuario no existe', async () => {
      serviceMock.createCierre.mockResolvedValue({ cierre: {}, message: 'ok' });

      await controller.createCierre(
        { tipo: undefined },
        { user: { sub: 42 } } as any,
      );

      expect(service.createCierre).toHaveBeenCalledWith(42, 'Diario' as TipoCierre);
    });

    it('retorna el resultado del service', async () => {
      const mockResult = { cierre: { id_cierre: 1 }, message: 'Cierre generado' };
      serviceMock.createCierre.mockResolvedValue(mockResult);

      const result = await controller.createCierre({ tipo: undefined }, validReq() as any);

      expect(result).toEqual(mockResult);
    });
  });

  // ─── previewCierre ────────────────────────────────────────────────────────

  describe('previewCierre', () => {
    it('llama al service con la fecha indicada', async () => {
      serviceMock.previewCierrePorFecha.mockResolvedValue({} as any);

      await controller.previewCierre('15/05/2026');

      expect(service.previewCierrePorFecha).toHaveBeenCalledWith('15/05/2026');
    });

    it('lanza BadRequestException si no se envía la fecha', async () => {
      await expect(controller.previewCierre(undefined as any)).rejects.toThrow(
        'El parámetro fecha es requerido en formato DD/MM/YYYY',
      );
    });

    it('retorna el resultado del service', async () => {
      const mockPreview = { totalIngresos: 5000, totalEgresos: 1000, utilidad: 4000 };
      serviceMock.previewCierrePorFecha.mockResolvedValue(mockPreview as any);

      const result = await controller.previewCierre('15/05/2026');

      expect(result).toEqual(mockPreview);
    });
  });

  // ─── getHistorial ─────────────────────────────────────────────────────────

  describe('getHistorial', () => {
    it('delega al service y retorna el resultado', async () => {
      const mockHistorial = [{ id_cierre: 1 }, { id_cierre: 2 }];
      serviceMock.getHistorial.mockResolvedValue(mockHistorial);

      const result = await controller.getHistorial();

      expect(service.getHistorial).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHistorial);
    });
  });
});
