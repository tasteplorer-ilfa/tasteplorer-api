import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Repository } from 'typeorm';
import { maxPageValidation, setPage } from '@common/utils/maxPageValidation';
import { MetaData } from '@common/dto/metaData.dto';
import { ArticleDto, ArticleListDto } from './dto/article.dto';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { GraphQLError } from 'graphql';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async findAll(page: number, pageSize: number): Promise<ArticleListDto> {
    maxPageValidation(pageSize);
    const offset: number = setPage(page, pageSize);

    try {
      const data = await this.articleRepository
        .createQueryBuilder('articles')
        .where('deleted_at IS NULL')
        .orderBy('articles.id', 'DESC')
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();

      const metaData: MetaData = {
        pageSize: pageSize,
        currentPage: page,
        total: data[1],
        totalPage: Math.ceil(data[1] / pageSize),
      };

      const articles: ArticleDto[] = data[0].map((item) => {
        const createdAt: string = utcToAsiaJakarta(item.createdAt);
        const updatedAt: string = utcToAsiaJakarta(item.updatedAt);

        const bannerDto: ArticleDto = {
          ...item,
          createdAt,
          updatedAt,
        };

        return bannerDto;
      });

      const result: ArticleListDto = {
        articles,
        meta: metaData,
      };

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findOne(id: number): Promise<ArticleDto> {
    try {
      const article = await this.articleRepository
        .createQueryBuilder('articles')
        .where('articles.id = :id', { id })
        .andWhere('articles.deleted_at IS NULL')
        .getOne();

      if (!article) {
        throw new GraphQLError('Article not found.');
      }

      const createdAt: string = utcToAsiaJakarta(article?.createdAt);
      const updatedAt: string = utcToAsiaJakarta(article?.updatedAt);

      const result: ArticleDto = {
        ...article,
        createdAt,
        updatedAt,
      };

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }
}
