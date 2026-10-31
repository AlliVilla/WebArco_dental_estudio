import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdir, readdir, stat, writeFile, realpath } from 'fs/promises';
import { resolve, dirname } from 'path';

export const uploadRoot = () => resolve(process.env.UPLOAD_DIR || './uploads');
export const privateUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 10, parts: 15 },
};

export function imageType(buffer: Buffer): { ext: string; mime: string } {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  )
    return { ext: 'png', mime: 'image/png' };
  if (
    buffer.length >= 3 &&
    buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
  )
    return { ext: 'jpg', mime: 'image/jpeg' };
  if (
    buffer.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
  )
    return { ext: 'gif', mime: 'image/gif' };
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return { ext: 'webp', mime: 'image/webp' };
  throw new BadRequestException(
    'Solo se aceptan imágenes PNG, JPEG, GIF o WebP con firma binaria válida',
  );
}

export function safeFilename(name: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.(png|jpe?g|gif|webp)$/i.test(name))
    throw new BadRequestException('Nombre de archivo inválido');
  return name;
}

// Serialize quota checks and writes in this process. Use an object storage quota for multiple replicas.
let pending: Promise<unknown> = Promise.resolve();
export async function storeImage(
  file: Express.Multer.File,
): Promise<Express.Multer.File> {
  if (!file?.buffer || file.buffer.length > 5 * 1024 * 1024)
    throw new PayloadTooLargeException();
  const type = imageType(file.buffer);
  const operation = pending
    .catch(() => undefined)
    .then(async () => {
      const root = uploadRoot();
      await mkdir(root, { recursive: true, mode: 0o700 });
      const entries = await readdir(root);
      const sizes = await Promise.all(
        entries.map(async (name) => (await stat(resolve(root, name))).size),
      );
      const quota = Number(
        process.env.UPLOAD_QUOTA_BYTES || 1024 * 1024 * 1024,
      );
      if (
        !Number.isFinite(quota) ||
        quota <= 0 ||
        sizes.reduce((a, b) => a + b, 0) + file.buffer.length > quota
      )
        throw new PayloadTooLargeException('Cuota de archivos alcanzada');
      const filename = `${randomUUID()}.${type.ext}`;
      const path = resolve(root, filename);
      await writeFile(path, file.buffer, { flag: 'wx', mode: 0o600 });
      return { ...file, filename, path, mimetype: type.mime };
    });
  pending = operation;
  return operation;
}

export async function confinedFile(filename: string): Promise<string> {
  safeFilename(filename);
  const root = await realpath(uploadRoot());
  const path = await realpath(resolve(root, filename));
  if (dirname(path) !== root)
    throw new BadRequestException('Archivo fuera del almacenamiento privado');
  return path;
}
