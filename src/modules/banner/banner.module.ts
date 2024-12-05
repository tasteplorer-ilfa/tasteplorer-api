import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerResolver } from './banner.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { BannerRepository } from './banner.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  providers: [BannerResolver, BannerService, BannerRepository],
})
export class BannerModule {}
