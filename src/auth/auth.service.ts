import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/CreateUserDto';
import { LoginDto } from './dtos/LoginDto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param registerDto - The user data to register
   * @returns A message indicating that the user was registered successfully
   */
  async register(registerDto: CreateUserDto): Promise<object> {
    const user = this.userRepository.create(registerDto);
    await this.userRepository.save(user);
    return {
      message: 'User registered successfully',
      statusCode: 201,
    };
  }

  /**
   * Login a user
   * @param loginDto - The user data to login
   * @returns A message indicating that the user was logged in successfully
   * @throws UnauthorizedException if the credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<object> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'password', 'role'],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      message: 'User logged in successfully',
      data: {
        access_token,
      },
      statusCode: 200,
    };
  }
}
