import { Test, TestingModule } from '@nestjs/testing';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';

describe('AuthServiceController', () => {
  let authServiceController: AuthServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthServiceController],
      providers: [AuthServiceService],
    }).compile();

    authServiceController = app.get<AuthServiceController>(AuthServiceController);
  });

  describe('root', () => {
    it('should return health status', () => {
      expect(authServiceController.health()).toEqual({ ok: true, service: 'auth-service', mode: 'HTTP' });
    });
  });
});
