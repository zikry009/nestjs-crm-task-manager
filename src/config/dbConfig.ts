import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.DB_SYNCHRONIZE,
  autoLoadEntities: process.env.DB_AUTO_LOAD_ENTITIES,
  logging: process.env.DB_LOGGING,
  poolSize: process.env.DB_POOL_SIZE,
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
}));
