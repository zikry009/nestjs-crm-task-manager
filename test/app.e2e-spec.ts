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
import { clearDatabase } from './helpers/db.helper';

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
