import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  /**
   * Elimina un archivo del disco
   */
  deleteFile(filename: string): { success: boolean; message: string } {
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`Archivo "${filename}" no encontrado`);
    }

    unlinkSync(filePath);
    return { success: true, message: `Archivo "${filename}" eliminado` };
  }
}