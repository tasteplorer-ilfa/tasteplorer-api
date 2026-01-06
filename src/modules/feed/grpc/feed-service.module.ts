import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'FEED_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'engagement',
            protoPath: join(process.cwd(), 'proto/engagement.proto'),
            url:
              configService.get<string>('ENGAGEMENT_SERVICE_GRPC_URL') ||
              'engagement-service:50051',
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
            channelOptions: {
              'grpc.max_send_message_length': -1,
              'grpc.max_receive_message_length': -1,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class FeedServiceModule {}
