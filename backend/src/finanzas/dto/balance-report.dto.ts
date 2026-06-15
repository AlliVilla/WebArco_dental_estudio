import { ApiProperty } from '@nestjs/swagger';

export class BalanceReportDto {
    @ApiProperty({
        description: 'Total de ingresos por consultas (Consulta_Tratamiento) en el período',
                 example: 5000.00,
    })
    totalIngresosConsultas: number;

    @ApiProperty({
        description: 'Total de cobranzas simples (PagoPaciente) en el período',
                 example: 2500.00,
    })
    totalCobranzasSimples: number;

    @ApiProperty({
        description: 'Total de pagos por consulta (PagoConsulta) en el período',
                 example: 2000.00,
    })
    totalPagosConsulta: number;

    @ApiProperty({
        description: 'Total de cobranzas consolidadas (simples + consulta)',
                 example: 4500.00,
    })
    totalCobranzas: number;

    @ApiProperty({
        description: 'Total activos circulantes (efectivo + cuentas por cobrar)',
                 example: 9500.00,
    })
    totalActivosCirculantes: number;

    @ApiProperty({
        description: 'Total egresos por inventario en el período',
        example: 1200.00,
    })
    totalEgresosPorInventario: number;

    @ApiProperty({
        description: 'Total pasivos circulantes (deudas estimadas)',
                 example: 500.00,
    })
    totalPasivosCirculantes: number;

    @ApiProperty({
        description: 'Flujo de caja actual (ingresos - egresos)',
                 example: 3800.00,
    })
    flujoCajaActual: number;

    @ApiProperty({
        description: 'Total de activos consolidados',
        example: 9500.00,
    })
    totalActivos: number;

    @ApiProperty({
        description: 'Total de pasivos consolidados',
        example: 500.00,
    })
    totalPasivos: number;

    @ApiProperty({
        description: 'Capital neto (activos - pasivos)',
                 example: 9000.00,
    })
    capitalNeto: number;

    @ApiProperty({
        description: 'Desglose de egresos por categoría de insumo',
        example: { Materiales: 800.00, 'Suministros Médicos': 400.00 },
    })
    egresosPorCategoria: Record<string, number>;

    @ApiProperty({
        description: 'Fecha de inicio del período reportado',
        example: '2026-01-01',
    })
    fechaInicio: Date;

    @ApiProperty({
        description: 'Fecha de fin del período reportado',
        example: '2026-01-31',
    })
    fechaFin: Date;
}
