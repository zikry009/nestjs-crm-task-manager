import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/CreateUserDto';
import { ApiBody, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dtos/LoginDto';
import { Role } from 'src/common/enums/roles.enum';

@Controller('auth')
@ApiTags('Auth Controller')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create new user' })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      userRegistration: {
        value: {
          name: 'John Doe',
          email: 'user@example.com',
          password: 'password123',
          role: Role.USER,
        },
        summary: 'User registration data',
      },
    },
  })
  @ApiSecurity([])
  async register(@Body() registerDto: CreateUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    type: LoginDto,
    examples: {
      userLogin: {
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiSecurity([])
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
