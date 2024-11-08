import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { maxPageValidation, setPage } from '@common/utils/maxPageValidation';
import { MetaData } from '@common/dto/metaData.dto';
import { BannerDto, BannerListDto } from './dto/banner.dto';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  async findAll(page: number, pageSize: number): Promise<BannerListDto> {
    maxPageValidation(pageSize);
    const offset: number = setPage(page, pageSize);

    try {
      const data = await this.bannerRepository
        .createQueryBuilder('banners')
        .where('deleted_at IS NULL')
        .orderBy('banners.id', 'DESC')
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();

      const metaData: MetaData = {
        pageSize: pageSize,
        currentPage: page,
        total: data[1],
        totalPage: Math.ceil(data[1] / pageSize),
      };

      const banners: BannerDto[] = data[0].map((item) => {
        const createdAt: string = utcToAsiaJakarta(item.createdAt);
        const updatedAt: string = utcToAsiaJakarta(item.updatedAt);

        const bannerDto: BannerDto = {
          ...item,
          createdAt,
          updatedAt,
        };

        return bannerDto;
      });

      const result: BannerListDto = {
        banners,
        meta: metaData,
      };

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findOne(id: number): Promise<BannerDto> {
    try {
      const banner = await this.bannerRepository
        .createQueryBuilder('banners')
        .where('banners.id = :id', { id })
        .andWhere('banners.deleted_at IS NULL')
        .getOne();

      if (!banner) {
        throw new GraphQLError('Banner not found.');
      }

      const createdAt: string = utcToAsiaJakarta(banner?.createdAt);
      const updatedAt: string = utcToAsiaJakarta(banner?.updatedAt);

      const result: BannerDto = {
        ...banner,
        createdAt,
        updatedAt,
      };

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }
}
