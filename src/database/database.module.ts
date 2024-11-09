import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('DATABASE_HOST'),
        port: 5432,
        database: configService.getOrThrow('DATABASE_NAME'),
        username: configService.getOrThrow('DATABASE_USERNAME'),
        password: configService.getOrThrow('DATABASE_PASS'),
        synchronize: false, // SET TRUE ONLY ON DEV, SET FALSE ON PRPODUCTION ENVIRONMENT
        autoLoadEntities: true,
        logging: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // migrations: [__dirname + '/database/migrations/*.ts'],
        migrations: [__dirname + '/database/migrations/*.ts'],
        cli: {
          migrationsDir: 'src/database/migrations',
        },
        // TODO: nestjs typeorm setup dialectOptions ssl true
        // ssl: { rejectUnauthorized: true, required: true },
        extra: {
          ssl: {
            require: true, // Enforces SSL connection (equivalent to 'sslmode=require')
            rejectUnauthorized: true, // Enforces server certificate validation
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
