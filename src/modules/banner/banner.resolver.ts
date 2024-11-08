import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BannerService } from './banner.service';

import { BannerDto, BannerListDto } from './dto/banner.dto';

@Resolver(() => BannerDto)
export class BannerResolver {
  constructor(private readonly bannerService: BannerService) {}

  @Query(() => BannerListDto, { name: 'bannerList' })
  async bannerList(
    @Args('page', { type: () => Int }) page: number,
    @Args('pageSize', { type: () => Int }) pageSize: number,
  ): Promise<BannerListDto> {
    return this.bannerService.findAll(page, pageSize);
  }

  @Query(() => BannerDto, { name: 'bannerDetail' })
  async bannerDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BannerDto> {
    return this.bannerService.findOne(id);
  }
}
