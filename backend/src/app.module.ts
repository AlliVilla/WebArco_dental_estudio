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
import { AntecedentePreguntaModule } from './antecedente-pregunta/antecedente-pregunta.module';
import { CitaModule } from './cita/cita.module';
import { ExpedienteClinicoModule } from './expediente-clinico/expediente-clinico.module';
import { ReminderModule } from './reminder/reminder.module';
import { PrismaModule } from './prisma/prisma.module';

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
    AntecedentePreguntaModule,
    CitaModule,
    ExpedienteClinicoModule,
    ReminderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
