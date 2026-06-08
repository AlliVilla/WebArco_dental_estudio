import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Get,
  Query,
  ConflictException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { RolService } from './rol.service';

import { Privileges } from 'src/auth/decorators/privileges.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from 'src/guards/privileges.guard';

@ApiTags('Roles')
@Controller('rol')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
export class RolController {
    constructor (private rolService: RolService) {}

    @Privileges(33)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Listar todos los roles',
        description: 'Retornar lista de roles con nombre, descripción, conteo de usuarios activos y privilegios asignados'
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

    
}
