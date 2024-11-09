import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ArticleService } from './article.service';
import { ArticleDto, ArticleListDto } from './dto/article.dto';

@Resolver(() => ArticleDto)
export class ArticleResolver {
  constructor(private readonly articleService: ArticleService) {}

  @Query(() => ArticleListDto, { name: 'articleList' })
  async articleList(
    @Args('page') page: number,
    @Args('pageSize') pageSize: number,
  ): Promise<ArticleListDto> {
    return this.articleService.findAll(page, pageSize);
  }

  @Query(() => ArticleDto, { name: 'articleDetail' })
  async articleDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<ArticleDto> {
    return this.articleService.findOne(id);
  }
}
