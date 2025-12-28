import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { DateScalar } from 'src/libs/common/src/scalars/date.scalar';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from '@module/auth/auth.module';
import { UserRepository } from './user.repository';
import { UserFollow } from './entities/user-follow.entity';
import { RabbitMQModule } from '@module/rabbitmq/rabbitmq.module';
import { EngagementServiceModule } from './grpc/engagement-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserFollow]),
    AuthModule,
    RabbitMQModule,
    EngagementServiceModule,
  ],
  providers: [UserResolver, UserService, DateScalar, UserRepository],
  exports: [UserService],
})
export class UserModule {}
