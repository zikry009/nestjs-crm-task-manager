import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from 'src/common/enums/roles.enum';
import { CreateUserDto } from './dtos/CreateUserDto';
import { LoginDto } from './dtos/LoginDto';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('register', () => {
    const registerDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password',
      role: Role.USER,
    };
    it('should register a new user', async () => {
      mockAuthService.register.mockReturnValue({
        message: 'User registered successfully',
        statusCode: 201,
      } as object);
      const result = await controller.register(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({
        message: 'User registered successfully',
        statusCode: 201,
      });
    });
  });
  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john.doe@example.com',
      password: 'password',
    };
    it('should login a user', async () => {
      mockAuthService.login.mockReturnValue({
        message: 'User logged in successfully',
        statusCode: 200,
      } as object);
      const result = await controller.login(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({
        message: 'User logged in successfully',
        statusCode: 200,
      });
    });
  });
});
