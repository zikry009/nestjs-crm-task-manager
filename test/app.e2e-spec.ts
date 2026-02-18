import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { mysqlDbOptions } from './helpers/db.helper';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import jwtConfigs from 'src/config/jwtConfigs';
import { testEnv } from './helpers/test.env';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/auth/dtos/CreateUserDto';
import { Role } from 'src/common/enums/roles.enum';
import { JwtAuthGuard } from 'src/common/guards/JwtAuthGuard';
import { TaskModule } from 'src/task/task.module';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { APP_GUARD } from '@nestjs/core';
import { CustomerModule } from 'src/customer/customer.module';
import { CreateCustomerTaskDto } from 'src/customer/dto/create-customer-task.dto';

/**
 * AppController (e2e) tests
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const mysqlSource = new DataSource(mysqlDbOptions() as DataSourceOptions);

  beforeAll(async () => {
    await mysqlSource.initialize();
    process.env = { ...testEnv };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: `.env.${process.env.NODE_ENV}`,
          load: [jwtConfigs],
        }),
      ],
    })
      .overrideProvider(DataSource)
      .useValue(mysqlSource)
      .compile();
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
    await mysqlSource.destroy();
    await app.close();
  });

  it('/api/v1/hello-world should return "Hello World!"', async () => {
    const expectedResponse = {
      success: true,
      message: 'Request successful',
      data: null,
      statusCode: 200,
    };
    const result = await request(app.getHttpServer())
      .get('/api/v1/hello-world')
      .expect(expectedResponse);
    expect(result.body).toEqual(expectedResponse);
  });
});

/**
 * AuthModule (e2e) tests
 */
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

/**
 * TaskModule (e2e) tests
 */

describe('TaskModule (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

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
  describe('GET /api/v1/task/:id', () => {
    it('should get a task by id', async () => {
      const result = await request(app.getHttpServer())
        .get('/api/v1/task/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual(expect.any(Object));
    });
  });
  describe('PUT /api/v1/task/:id', () => {
    it('should update a task by id', async () => {
      const result = await request(app.getHttpServer())
        .put('/api/v1/task/1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Task 1',
          description: 'Task 1 description',
          status: TaskStatus.TODO,
        })
        .expect(200);
      expect(result.status).toBe(200);
      expect(result.body).toEqual(expect.any(Object));
    });
  });
  describe('DELETE /api/v1/task/:id', () => {
    it('should delete a task by id', async () => {
      const result = await request(app.getHttpServer())
        .delete('/api/v1/task/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(result.status).toBe(200);
      expect(result.body).toEqual(expect.any(Object));
    });
  });
});

/**
 * CustomerModule (e2e) tests
 */
describe('CustomerModule (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

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
        CustomerModule,
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
  describe('POST /api/v1/customer', () => {
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
    it('should create a new customer', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      // 2. Login and get token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'john.doe@example.com', password: 'password123' });

      token = loginRes.body.data.access_token;
      const result = await request(app.getHttpServer())
        .post('/api/v1/customer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Example Inc.',
          contact: 1234567890,
        })
        .expect(201);
      expect(result.status).toBe(201);
      expect(result.body).toEqual(expect.any(Object));
    });
  });
  describe('POST /api/v1/customer/create-task', () => {
    const createCustomerTaskDto: CreateCustomerTaskDto = {
      title: 'Task 1',
      description: 'Task 1 description',
      customerName: 'John Doe',
      status: TaskStatus.TODO,
      assignedUserEmail: 'john.doe@example.com',
    };
    it('should create a new customer task', async () => {
      const result = await request(app.getHttpServer())
        .post('/api/v1/customer/create-task')
        .set('Authorization', `Bearer ${token}`)
        .send(createCustomerTaskDto);
      expect(result.status).toBe(201);
      expect(result.body).toEqual(expect.any(Object));
    });
  });
  describe('PUT /api/v1/customer/assign-task/:customerId/:taskId', () => {
    it('should assign a task to a customer', async () => {
      const result = await request(app.getHttpServer())
        .put('/api/v1/customer/assign-task/1/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(result.status).toBe(200);
      expect(result.body).toEqual(expect.any(Object));
    });
  });
  describe('GET /api/v1/customer', () => {
    it('should get all customers', async () => {
      const result = await request(app.getHttpServer())
        .get('/api/v1/customer')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(result.status).toBe(200);
      expect(result.body).toEqual(expect.any(Object));
    });
  });
});
