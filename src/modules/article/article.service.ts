import { Injectable } from '@nestjs/common';
import { maxPageValidation, setPage } from '@common/utils/maxPageValidation';
import { MetaData } from '@common/dto/metaData.dto';
import { ArticleDto, ArticleListDto } from './dto/article.dto';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { GraphQLError } from 'graphql';
import { ArticleRepository } from './article.repository';

@Injectable()
export class ArticleService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async findAll(page: number, pageSize: number): Promise<ArticleListDto> {
    maxPageValidation(pageSize);
    const offset: number = setPage(page, pageSize);

    try {
      const [data, total] = await this.articleRepository.findAll(
        offset,
        pageSize,
      );

      const metaData: MetaData = {
        pageSize: pageSize,
        currentPage: page,
        total,
        totalPage: Math.ceil(total / pageSize),
      };

      const articles: ArticleDto[] = data.map((item) => {
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
      const article = await this.articleRepository.findById(id);

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
