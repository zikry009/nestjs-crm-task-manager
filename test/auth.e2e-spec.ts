import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { mysqlDbOptions } from './helpers/db.helper';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { testEnv } from './helpers/test.env';
import { CreateUserDto } from 'src/auth/dtos/CreateUserDto';
import { Role } from 'src/common/enums/roles.enum';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('AuthModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env = { ...testEnv };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              jwt: {
                secret: process.env.JWT_SECRET,
                expirationTime: process.env.JWT_EXPIRATION_TIME,
              },
            }),
          ],
        }),
        TypeOrmModule.forRoot(mysqlDbOptions() as DataSourceOptions),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    const registerDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: Role.USER,
    };

    it('should register a new user successfully', async () => {
      const result = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      expect(result.body).toEqual({
        message: 'User registered successfully',
        statusCode: 201,
      });
    });
  });

  describe('POST /api/v1/login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(result.body).toEqual({
        message: 'User logged in successfully',
        data: {
          access_token: expect.any(String),
        },
        statusCode: 200,
      });
      expect(result.body.data.access_token).toBeDefined();
    });
  });
});
