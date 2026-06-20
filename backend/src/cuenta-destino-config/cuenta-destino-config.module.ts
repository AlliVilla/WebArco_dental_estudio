import { Module } from '@nestjs/common';
import { CuentaDestinoConfigController } from './cuenta-destino-config.controller';
import { CuentaDestinoConfigService } from './cuenta-destino-config.service';

@Module({
  controllers: [CuentaDestinoConfigController],
  providers: [CuentaDestinoConfigService],
})
export class CuentaDestinoConfigModule {}
