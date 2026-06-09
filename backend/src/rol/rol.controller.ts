import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  ParseIntPipe,
  Put,
  Get,
  Query,
  ConflictException,
  Param,
  Delete
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { RolService } from './rol.service';

import { CreateRoleDto } from './dto/createRole.dto';

import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from 'src/guards/privileges.guard';
import { UpdateRoleDto } from './dto/updateRole.dto';

@ApiTags('Roles')
@Controller('rol')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
export class RolController {
    constructor (private rolService: RolService) {}

    @Privileges(34)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Listar todos los roles',
        description: 'Retornar lista de roles activos con nombre, descripción, conteo de usuarios activos y privilegios asignados'
    })
    @ApiConflictResponse({description: 'page y limit deben ser mayores a 0'})
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        const pageNumber = page ? parseInt(page) : 1;
        const limitNumber = limit ? parseInt(limit) : 10;

        if(pageNumber < 1 || limitNumber < 1){
            throw new ConflictException("page y limit deben ser mayores a 0");
        }

        return this.rolService.findAll(pageNumber,limitNumber,search);
    }

    @Privileges(35)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Crear rol',
        description: 'Crear nuevo rol con nombre (único, requerido, máx. 100 chars) y descripción (opcional). DTO con class-validator.'
    })
    @ApiCreatedResponse({description: 'Rol creado exitosamente'})
    @ApiConflictResponse({description: 'El nombre del rol ya existe'})
    async createRole(@Body() body : CreateRoleDto){
        return this.rolService.createRole(body);
    }

    @Privileges(36)
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Actualizar Rol',
        description: 'Actualizar nombre y/o descripción. Validar que el nombre no esté ya en uso por otro rol.'
    })
    @ApiOkResponse({description: 'Rol actualizado exitosamente'})
    @ApiConflictResponse({description: 'El nombre del rol ya existe'})
    async updateRole(@Param('id', ParseIntPipe) id : number,@Body() body: UpdateRoleDto){
        return this.rolService.updateRole(id,body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
      summary: 'Eliminar Rol',
      description:
        'Realiza un borrado lógico del rol. Si existen usuarios activos asociados, se retorna un error 409 con el detalle.',
    })
    @ApiOkResponse({ description: 'Rol eliminado (desactivado) correctamente' })
    @ApiNotFoundResponse({ description: 'Rol no encontrado' })
    @ApiConflictResponse({
      description: 'El rol tiene usuarios activos asociados',
    })
    async deleteRole(
      @Param('id', ParseIntPipe) id: number,
    ) {
      return this.rolService.deleteRole(id);
    }

}
