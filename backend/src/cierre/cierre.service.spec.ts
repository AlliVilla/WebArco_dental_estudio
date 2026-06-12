import { Test, TestingModule } from '@nestjs/testing';
import { CierreService } from './cierre.service';

describe('CierreService', () => {
  let service: CierreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CierreService],
    }).compile();

    service = module.get<CierreService>(CierreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
