import { Article } from '@module/article/entities/article.entity';
import { Banner } from '@module/banner/entities/banner.entity';
import { User } from '@module/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.getOrThrow('DATABASE_HOST'),
  port: 5432,
  database: configService.getOrThrow('DATABASE_NAME'),
  username: configService.getOrThrow('DATABASE_USERNAME'),
  password: configService.getOrThrow('DATABASE_PASS'),
  entities: [Article, Banner, User],
  migrations: ['src/database/migrations/**'],
  extra: {
    ssl: {
      require: true, // Enforces SSL connection (equivalent to 'sslmode=require')
      rejectUnauthorized: true, // Enforces server certificate validation
    },
  },
});
