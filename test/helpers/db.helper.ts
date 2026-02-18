import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * SQLite in-memory TypeORM config.
 *
 * Used with overrideProvider(getDataSourceToken()) to replace the
 * TypeOrmModule.forRootAsync() + ConfigService wiring in AppModule —
 * so MySQL is never touched during e2e tests.
 *
 * Entities are auto-globbed from src/entities so you never need to
 * update this file when you add a new entity.
 */
export function mysqlDbOptions(): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'task_crm_test',
    entities: [__dirname + '/../../src/entities/*.entity{.ts,.js}'],
    synchronize: true, // builds schema from entity decorators — fine for tests
    dropSchema: true,
    logging: false,
    autoLoadEntities: true,
  };
}

