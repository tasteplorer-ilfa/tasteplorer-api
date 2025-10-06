import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'SEARCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'search',
            protoPath: join(process.cwd(), 'proto/search.proto'),
            url:
              configService.get<string>('SEARCH_SERVICE_GRPC_URL') ||
              'search-service:9001',
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class SearchServiceModule {}
