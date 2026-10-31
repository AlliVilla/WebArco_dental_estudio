import {
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  storeImage,
  confinedFile,
  safeFilename,
  imageType,
  uploadRoot,
} from './private-storage';
import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { UploadService } from './upload.service';

import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('upload')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── 1. Un solo archivo ─────────────────────────────────────────
  @Privileges(21)
  @Post('single')
  @ApiOperation({ summary: 'Subir un solo archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido correctamente' })
  @ApiResponse({ status: 400, description: 'Error al subir archivo' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return {
      ...(await this.persist(file, req.user.id_usuario)),
      message: 'Archivo subido correctamente',
    };
  }

  private async persist(file: Express.Multer.File, ownerId: number) {
    const saved = await storeImage(file);
    await this.prisma.storedUpload.create({
      data: { filename: saved.filename, ownerId },
    });
    return {
      originalName: saved.originalname,
      filename: saved.filename,
      size: saved.size,
      mimetype: saved.mimetype,
    };
  }

  // ─── 2. Múltiples archivos ──────────────────────────────────────
  @Privileges(21)
  @Post('multiple')
  @ApiOperation({ summary: 'Subir múltiples archivos (máx 5)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivos subidos correctamente' })
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files?.length)
      throw new BadRequestException('No se recibieron archivos');
    files.forEach((file) => imageType(file.buffer));
    const result: any[] = [];
    for (const file of files)
      result.push(await this.persist(file, req.user.id_usuario));
    return result;
  }

  // ─── 3. Campos diferentes ───────────────────────────────────────
  @Privileges(21)
  @Post('fields')
  @ApiOperation({ summary: 'Subir archivos en diferentes campos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
        document: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivos subidos correctamente' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ]),
  )
  async uploadFields(
    @UploadedFiles()
    files: { avatar?: Express.Multer.File[]; document?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    const all = [...(files.avatar || []), ...(files.document || [])];
    if (!all.length) throw new BadRequestException('No se recibieron archivos');
    all.forEach((file) => imageType(file.buffer));
    const avatar = files.avatar?.[0]
      ? await this.persist(files.avatar[0], req.user.id_usuario)
      : null;
    const document = files.document?.[0]
      ? await this.persist(files.document[0], req.user.id_usuario)
      : null;
    return {
      avatar: avatar?.filename ?? null,
      document: document?.filename ?? null,
    };
  }

  // ─── 4. Servir archivo ──────────────────────────────────────────
  @Privileges(20, 21, 25, 22)
  @Get(':filename')
  @ApiOperation({ summary: 'Obtener archivo por nombre' })
  @ApiParam({
    name: 'filename',
    example: 'file-123456.png',
  })
  @ApiResponse({ status: 200, description: 'Archivo encontrado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async serveFile(
    @Param('filename') filename: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    safeFilename(filename);
    const linked = await this.prisma.archivo.findFirst({
      where: { url: filename },
      select: { id_archivo: true },
    });
    const paths = [filename, `/uploads/${filename}`, `/static/${filename}`];
    const signature = await this.prisma.consulta.findFirst({
      where: {
        OR: [
          { firma_paciente: { in: paths } },
          { firma_doctor_snapshot: { in: paths } },
        ],
      },
      select: { consentimiento: true },
    });
    const staged = await this.prisma.storedUpload.findUnique({
      where: { filename },
    });
    // Same expediente visibility policy as the clinical endpoints (privilege 20).
    const hasAccess = linked
      ? req.user.privilegios.includes(20)
      : signature
        ? req.user.privilegios.includes(signature.consentimiento ? 25 : 20)
        : staged?.ownerId === req.user.id_usuario;
    if (!hasAccess) {
      throw new ForbiddenException('No tiene acceso a este archivo');
    }
    let path: string;
    try {
      path = await confinedFile(filename);
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    return res.sendFile(path, { root: uploadRoot(), dotfiles: 'deny' });
  }
}
