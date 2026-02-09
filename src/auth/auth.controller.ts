import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/CreateUserDto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dtos/LoginDto';

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
        },
        summary: 'User registration data',
      },
    },
  })
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
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
