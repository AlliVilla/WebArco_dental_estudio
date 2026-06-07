import { Controller, Get, Post, Query, Param, Patch, Body, ParseIntPipe } from '@nestjs/common';
import { ConsentimientoService } from './consentimiento.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';
import { UpdateSignaturesDto } from './dto/update-signatures.dto';

@Controller('consents')
export class ConsentimientoController {
  constructor(private readonly consentimientoService: ConsentimientoService) {}

  @Post()
  create(@Body() createConsentimientoDto: CreateConsentimientoDto) {
    return this.consentimientoService.create(createConsentimientoDto);
  }

  @Get('stats')
  getStats() {
    return this.consentimientoService.getStats();
  }

  @Get()
  findAll(@Query() query: QueryConsentimientoDto) {
    return this.consentimientoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.findOne(id);
  }

  @Get(':id/print')
  imprimir(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.imprimirConsentimiento(id);
  }

  @Patch(':id/signatures')
  updateSignatures(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSignaturesDto: UpdateSignaturesDto,
  ) {
    return this.consentimientoService.updateSignatures(id, updateSignaturesDto);
  }
}
