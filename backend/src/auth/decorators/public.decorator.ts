import { SetMetadata } from '@nestjs/common';
// Public routes must implement their own protocol-specific validation.
export const Public = () => SetMetadata('public', true);
