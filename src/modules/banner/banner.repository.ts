import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BannerRepository {
  constructor(
    @InjectRepository(Banner)
    private readonly repository: Repository<Banner>,
  ) {}

  async findAll(offset: number, limit: number) {
    return this.repository
      .createQueryBuilder('banners')
      .where('deleted_at IS NULL')
      .orderBy('banners.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async findById(id: number) {
    return this.repository
      .createQueryBuilder('banners')
      .where('banners.id = :id', { id })
      .andWhere('banners.deleted_at IS NULL')
      .getOne();
  }
}
