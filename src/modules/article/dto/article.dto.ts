import { MetaData } from '@common/dto/metaData.dto';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ArticleDto {
  @Field(() => ID, { description: 'Article ID' })
  id: number;

  @Field(() => String, { description: 'Article Title' })
  title: string;

  @Field(() => String, { description: 'Article Image' })
  imageUrl: string;

  @Field(() => String, { description: 'Article Description' })
  description: string;

  @Field(() => String, { description: 'Article Created At' })
  createdAt: string;

  @Field(() => String, { description: 'Article Updated At' })
  updatedAt: string;

  @Field(() => Date, { description: 'Article Deleted At', nullable: true })
  deletedAt?: Date;
}

@ObjectType()
export class ArticleListDto {
  @Field(() => [ArticleDto], { description: 'Article List Data' })
  articles: ArticleDto[];

  @Field(() => MetaData, { description: 'Article Metadata' })
  meta: MetaData;
}
