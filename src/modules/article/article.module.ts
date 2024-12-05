import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleResolver } from './article.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { ArticleRepository } from './article.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  providers: [ArticleResolver, ArticleService, ArticleRepository],
})
export class ArticleModule {}
