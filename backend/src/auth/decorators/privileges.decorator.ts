import { SetMetadata } from '@nestjs/common';

export const PRIV_KEY = 'privileges';
export const Privileges = (...privileges: number[]) =>
  SetMetadata(PRIV_KEY, privileges);