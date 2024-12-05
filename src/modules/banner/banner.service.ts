import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { maxPageValidation, setPage } from '@common/utils/maxPageValidation';
import { MetaData } from '@common/dto/metaData.dto';
import { BannerDto, BannerListDto } from './dto/banner.dto';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { BannerRepository } from './banner.repository';

@Injectable()
export class BannerService {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async findAll(page: number, pageSize: number): Promise<BannerListDto> {
    maxPageValidation(pageSize);
    const offset: number = setPage(page, pageSize);

    try {
      const [data, total] = await this.bannerRepository.findAll(
        offset,
        pageSize,
      );

      const metaData: MetaData = {
        pageSize: pageSize,
        currentPage: page,
        total,
        totalPage: Math.ceil(total / pageSize),
      };

      const banners: BannerDto[] = data.map((item) => {
        const createdAt: string = utcToAsiaJakarta(item.createdAt);
        const updatedAt: string = utcToAsiaJakarta(item.updatedAt);

        const bannerDto: BannerDto = {
          ...item,
          createdAt,
          updatedAt,
        };

        return bannerDto;
      });

      const result: BannerListDto = new BannerListDto({
        banners,
        meta: metaData,
      });

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findOne(id: number): Promise<BannerDto> {
    try {
      const banner = await this.bannerRepository.findById(id);

      if (!banner) {
        throw new GraphQLError('Banner not found.');
      }

      const createdAt: string = utcToAsiaJakarta(banner?.createdAt);
      const updatedAt: string = utcToAsiaJakarta(banner?.updatedAt);

      const result: BannerDto = new BannerDto({
        ...banner,
        createdAt,
        updatedAt,
      });

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }
}
