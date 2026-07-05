import { Test, TestingModule } from '@nestjs/testing';
import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';

describe('TenantServiceController', () => {
  let tenantServiceController: TenantServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TenantServiceController],
      providers: [TenantServiceService],
    }).compile();

    tenantServiceController = app.get<TenantServiceController>(TenantServiceController);
  });

  describe('root', () => {
    it('should return health status', () => {
      expect(tenantServiceController.health()).toEqual({ ok: true, service: 'tenant-service', mode: 'HTTP' });
    });
  });
});
