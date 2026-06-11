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
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ─── 1. Un solo archivo ─────────────────────────────────────────
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
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    return {
      success: true,
      message: 'Archivo subido correctamente',
      data: {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      },
    };
  }

  // ─── 2. Múltiples archivos ──────────────────────────────────────
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
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron archivos');
    }

    return {
      success: true,
      message: `${files.length} archivo(s) subido(s)`,
      data: files.map((f) => ({
        originalName: f.originalname,
        filename: f.filename,
        size: f.size,
      })),
    };
  }

  // ─── 3. Campos diferentes ───────────────────────────────────────
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
  uploadFields(
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ) {
    return {
      success: true,
      message: 'Archivos subidos',
      data: {
        avatar: files.avatar?.[0]?.filename ?? null,
        document: files.document?.[0]?.filename ?? null,
      },
    };
  }

  // ─── 4. Servir archivo ──────────────────────────────────────────
  @Get(':filename')
  @ApiOperation({ summary: 'Obtener archivo por nombre' })
  @ApiParam({
    name: 'filename',
    example: 'file-123456.png',
  })
  @ApiResponse({ status: 200, description: 'Archivo encontrado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}