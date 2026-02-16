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
import { TaskModule } from 'src/task/task.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/common/guards/JwtAuthGuard';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';

describe('TaskModule (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let dataSource: DataSource;

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
        TaskModule,
      ],
      providers: [
        JwtStrategy,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
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
  describe('POST /api/v1/task', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Task 1',
      description: 'Task 1 description',
      assignedUserEmail: 'john.doe@example.com',
      status: TaskStatus.TODO,
    };
    const registerDto: CreateUserDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: Role.ADMIN,
    };

    it('should create a new task', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      // 2. Login and get token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'john.doe@example.com', password: 'password123' });

      token = loginRes.body.data.access_token;
      const result = await request(app.getHttpServer())
        .post('/api/v1/task')
        .send(createTaskDto)
        .set('Authorization', `Bearer ${token}`);
      expect(result.body).toEqual({
        message: 'Task created successfully',
        statusCode: 201,
      });
    });

    it('should not create a new task if the user is not logged in', async () => {
      const exceptedResponse = {
        message: 'User not found',
        statusCode: 404,
        error: 'Not Found',
      };
      const result = await request(app.getHttpServer())
        .post('/api/v1/task')
        .send({ ...createTaskDto, assignedUserEmail: 'invalid@example.com' })
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect(exceptedResponse);
      expect(result.status).toBe(404);
      expect(result.body).toEqual(exceptedResponse);
    });
  });
  describe('GET /api/v1/task', () => {
    it('should get all tasks for admin', async () => {
      console.log(token);
      const result = await request(app.getHttpServer())
        .get('/api/v1/task')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.data).toHaveLength(1);
        });
      expect(result.status).toBe(200);
      expect(result.body.data).toHaveLength(1);
    });
  });
});
