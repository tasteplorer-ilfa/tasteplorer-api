import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {}

  async findAll(offset: number, limit: number) {
    return this.repository
      .createQueryBuilder('articles')
      .where('deleted_at IS NULL')
      .orderBy('articles.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async findById(id: number) {
    return this.repository
      .createQueryBuilder('articles')
      .where('articles.id = :id', { id })
      .andWhere('articles.deleted_at IS NULL')
      .getOne();
  }
}
