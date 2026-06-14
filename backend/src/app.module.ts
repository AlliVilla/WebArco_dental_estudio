import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolModule } from './rol/rol.module';
import { PrivilegioModule } from './privilegio/privilegio.module';
import { DepartamentoModule } from './departamento/departamento.module';
import { MunicipioModule } from './municipio/municipio.module';
import { PersonaModule } from './persona/persona.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ConsultaModule } from './consulta/consulta.module';
import { OdontogramaModule } from './odontograma/odontograma.module';
import { PagoPacienteModule } from './pago-paciente/pago-paciente.module';
import { ConsultaPreguntaModule } from './consulta-pregunta/consulta-pregunta.module';
import { AuthModule } from './auth/auth.module';
import { CitaModule } from './cita/cita.module';
import { ExpedienteClinicoModule } from './expediente-clinico/expediente-clinico.module';
import { ReminderModule } from './reminder/reminder.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConsentimientoModule } from './consentimiento/consentimiento.module';
import { InsumoModule } from './insumo/insumo.module';
import { InventarioModule } from './inventario/inventario.module';
import { CategoriaInsumoModule } from './categoria-insumo/categoria-insumo.module';
import { UnidadMedidaModule } from './unidad-medida/unidad-medida.module';
import { TratamientoModule } from './tratamiento/tratamiento.module';
import { TratamientoPacienteModule } from './tratamiento-paciente/tratamiento-paciente.module';
import { PagoConsultaModule } from './pago-consulta/pago-consulta.module';
import { EspecialidadModule } from './especialidad/especialidad.module';
import { EstadoOdontogramaModule } from './estado-odontograma/estado-odontograma.module';
import { UploadModule } from './upload/upload.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { EgresoModule } from './egreso/egreso.module';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';  

@Module({
  imports: [
    PrismaModule,
    RolModule,
    PrivilegioModule,
    DepartamentoModule,
    MunicipioModule,
    PersonaModule,
    UsuarioModule,
    ConsultaModule,
    OdontogramaModule,
    PagoPacienteModule,
    ConsultaPreguntaModule,
    EgresoModule,
    ConsentimientoModule,
    AuthModule,
    CitaModule,
    ExpedienteClinicoModule,
    ReminderModule,
    InsumoModule,
    InventarioModule,
    CategoriaInsumoModule,
    UnidadMedidaModule,
    TratamientoModule,
    TratamientoPacienteModule,
    PagoConsultaModule,
    FinanzasModule,
    EspecialidadModule,
    EstadoOdontogramaModule,
    UploadModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/static',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}