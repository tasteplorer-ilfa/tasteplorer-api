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
        synchronize: configService.getOrThrow('DATABASE_IS_SYNCRONIZE'), // SET TRUE ONLY ON DEV, SET FALSE ON PRPODUCTION ENVIRONMENT
        autoLoadEntities: true,
        // TODO: nestjs typeorm setup dialectOptions ssl true
        ssl: { rejectUnauthorized: true },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
