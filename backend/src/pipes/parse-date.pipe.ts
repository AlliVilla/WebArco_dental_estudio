import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform {
  transform(value: string): Date {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Fecha inválida: ${value}`);
    }

    return date;
  }
}