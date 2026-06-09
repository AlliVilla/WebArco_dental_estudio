import { Controller, UseGuards, Get, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { PrivilegioService } from './privilegio.service';
import { InsertRolePrivilegeDto } from './dto/insert-role-privilege.dto';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Privilegios')
@Controller('privilegio')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class PrivilegioController {
    constructor(private privilegioService : PrivilegioService){}
    
    @Get()
    @Privileges(37)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Listar Privilegios',
        description: 'Retorna la lista de privilegios del sistema'
    })
    async findAll() {
        return this.privilegioService.findAll();
    }


    @Post('rol')
    @Privileges(38)
    @ApiOperation({
        summary: 'Insertar privilegio a un rol',
        description: 'Inserción de un privilegio a un rol en la tabla de rol_privilegio'
    })
    @HttpCode(HttpStatus.CREATED)
    async insertRolePRivilege(@Body() body: InsertRolePrivilegeDto) {
        return this.privilegioService.insertRolePrivilege(body);
    }
}
