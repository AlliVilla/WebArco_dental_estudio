import { Test, TestingModule } from '@nestjs/testing';
import { CierreController } from './cierre.controller';

describe('CierreController', () => {
  let controller: CierreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CierreController],
    }).compile();

    controller = module.get<CierreController>(CierreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
