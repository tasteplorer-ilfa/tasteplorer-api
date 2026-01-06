import { Module } from '@nestjs/common';
import { FeedResolver } from './feed.resolver';
import { FeedService } from './feed.service';
import { FeedServiceModule } from './grpc/feed-service.module';
import { AuthModule } from '@module/auth/auth.module';

@Module({
  imports: [FeedServiceModule, AuthModule],
  providers: [FeedResolver, FeedService],
  exports: [FeedService],
})
export class FeedModule {}
