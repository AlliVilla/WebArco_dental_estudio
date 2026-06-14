import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CierreService } from './cierre.service';
import { PrismaService } from '../prisma/prisma.service';
import { TipoCierre } from '@prisma/client';

jest.mock('@prisma/client', () => ({
  TipoCierre: {
    Diario: 'Diario',
    Semanal: 'Semanal',
    Quincenal: 'Quincenal',
    Mensual: 'Mensual',
  },
}));

/** Helpers para comparar fechas ignorando milisegundos */
const daysDiff = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

describe('CierreService', () => {
  let service: CierreService;
  let prisma: jest.Mocked<PrismaService>;

  /** Mock mínimo de PrismaService — solo los métodos que usa CierreService */
  const prismaMock = {
    cierre: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    egreso: {
      aggregate: jest.fn(),
    },
    pagoPaciente: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CierreService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CierreService>(CierreService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getDateRange (mediante previewCierre, que llama al método privado) ────

  describe('getDateRange (implícito via previewCierre)', () => {
    const mockEmptyPreview = () => {
      prismaMock.egreso.aggregate.mockResolvedValue({ _sum: { monto: null } });
      prismaMock.pagoPaciente.groupBy.mockResolvedValue([]);
    };

    it('Diario: start y end son el mismo día de hoy', async () => {
      mockEmptyPreview();
      await service.previewCierre('Diario');

      const { fechaWhere } = captureWhere(prismaMock.egreso.aggregate);
      expect(daysDiff(fechaWhere.gte, fechaWhere.lte)).toBe(0);
    });

    it('Semanal: rango de 6 días antes de hoy (7 días en total)', async () => {
      mockEmptyPreview();
      await service.previewCierre('Semanal');

      const { fechaWhere } = captureWhere(prismaMock.egreso.aggregate);
      expect(daysDiff(fechaWhere.gte, fechaWhere.lte)).toBe(6);
    });

    it('Quincenal: rango de 14 días antes de hoy (15 días en total)', async () => {
      mockEmptyPreview();
      await service.previewCierre('Quincenal');

      const { fechaWhere } = captureWhere(prismaMock.egreso.aggregate);
      expect(daysDiff(fechaWhere.gte, fechaWhere.lte)).toBe(14);
    });

    it('Mensual: start es aproximadamente 1 mes antes que end', async () => {
      mockEmptyPreview();
      await service.previewCierre('Mensual');

      const { fechaWhere } = captureWhere(prismaMock.egreso.aggregate);
      const diffDays = daysDiff(fechaWhere.gte, fechaWhere.lte);
      // Puede ser 28-31 días dependiendo del mes
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  // ─── previewCierre ────────────────────────────────────────────────────────

  describe('previewCierre', () => {
    it('calcula correctamente totalIngresos, totalEgresos y utilidad', async () => {
      prismaMock.egreso.aggregate.mockResolvedValue({ _sum: { monto: 2000 } });
      prismaMock.pagoPaciente.groupBy.mockResolvedValue([
        { metodo_pago: 'Efectivo',      _sum: { abono: 5000 } },
        { metodo_pago: 'Tarjeta',       _sum: { abono: 3000 } },
        { metodo_pago: 'Transferencia', _sum: { abono: 2000 } },
      ]);

      const result = await service.previewCierre('Diario');

      expect(result.efectivo).toBe(5000);
      expect(result.tarjeta).toBe(3000);
      expect(result.transferencia).toBe(2000);
      expect(result.totalIngresos).toBe(10000);
      expect(result.totalEgresos).toBe(2000);
      expect(result.utilidad).toBe(8000);
    });

    it('devuelve ceros cuando no hay movimientos en el período', async () => {
      prismaMock.egreso.aggregate.mockResolvedValue({ _sum: { monto: null } });
      prismaMock.pagoPaciente.groupBy.mockResolvedValue([]);

      const result = await service.previewCierre('Diario');

      expect(result.totalIngresos).toBe(0);
      expect(result.totalEgresos).toBe(0);
      expect(result.utilidad).toBe(0);
    });

    it('redondea la utilidad a 2 decimales correctamente', async () => {
      prismaMock.egreso.aggregate.mockResolvedValue({ _sum: { monto: 3333.333 } });
      prismaMock.pagoPaciente.groupBy.mockResolvedValue([
        { metodo_pago: 'Efectivo', _sum: { abono: 10000 } },
      ]);

      const result = await service.previewCierre('Diario');

      expect(result.utilidad).toBe(Math.round((10000 - 3333.333) * 100) / 100);
    });

    it('devuelve tipoCierre en la respuesta', async () => {
      prismaMock.egreso.aggregate.mockResolvedValue({ _sum: { monto: null } });
      prismaMock.pagoPaciente.groupBy.mockResolvedValue([]);

      const result = await service.previewCierre('Semanal');

      expect(result.tipoCierre).toBe('Semanal');
    });
  });

  // ─── createCierre ─────────────────────────────────────────────────────────

  describe('createCierre', () => {
    it('lanza BadRequestException si ya existe un cierre del mismo tipo en el período', async () => {
      prismaMock.cierre.findFirst.mockResolvedValue({ id_cierre: 1 });

      await expect(service.createCierre(1, 'Diario')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('el mensaje del error de duplicado menciona el tipo de cierre', async () => {
      prismaMock.cierre.findFirst.mockResolvedValue({ id_cierre: 1 });

      await expect(service.createCierre(1, 'Semanal')).rejects.toThrow(
        /Semanal/,
      );
    });

    it('crea el cierre con los datos del preview cuando no existe uno previo', async () => {
      prismaMock.cierre.findFirst.mockResolvedValue(null);
      prismaMock.egreso.aggregate.mockResolvedValue({ _sum: { monto: 1000 } });
      prismaMock.pagoPaciente.groupBy.mockResolvedValue([
        { metodo_pago: 'Efectivo', _sum: { abono: 4000 } },
      ]);
      const mockCierre = { id_cierre: 99, tipo_cierre: 'Diario' };
      prismaMock.cierre.create.mockResolvedValue(mockCierre);

      const result = await service.createCierre(2, 'Diario');

      expect(prismaMock.cierre.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo_cierre: 'Diario',
            id_usuario: 2,
            ingresos: 4000,
            egresos: 1000,
            utilidad: 3000,
          }),
        }),
      );
      expect(result.message).toBe('Cierre de caja generado exitosamente');
      expect(result.cierre).toEqual(mockCierre);
    });
  });

  // ─── getHistorial ─────────────────────────────────────────────────────────

  describe('getHistorial', () => {
    it('retorna los cierres ordenados por fecha descendente', async () => {
      const mockData = [{ id_cierre: 2 }, { id_cierre: 1 }];
      prismaMock.cierre.findMany.mockResolvedValue(mockData);

      const result = await service.getHistorial();

      expect(prismaMock.cierre.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { fecha: 'desc' } }),
      );
      expect(result).toEqual(mockData);
    });
  });
});

// ─── Utilitario para extraer el filtro de fecha del primer llamado ──────────
function captureWhere(mockFn: jest.Mock): { fechaWhere: { gte: Date; lte: Date } } {
  const callArg = mockFn.mock.calls[0][0] as { where: { fecha: { gte: Date; lte: Date } } };
  return { fechaWhere: callArg.where.fecha };
}
