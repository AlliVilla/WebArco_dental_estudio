import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { PrismaModule } from '../prisma/prisma.module';
=======
>>>>>>> main
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';

@Module({
<<<<<<< HEAD
  imports: [PrismaModule],
  controllers: [InventarioController],
  providers: [InventarioService],
=======
  controllers: [InventarioController],
  providers: [InventarioService]
>>>>>>> main
})
export class InventarioModule {}
