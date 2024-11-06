import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MetaData {
  @Field(() => Int, { description: 'page size of a list data' })
  pageSize: number;

  @Field(() => Int, { description: 'current page of a list data' })
  currentPage: number;

  @Field(() => Int, { description: 'total data of list data' })
  total: number;

  @Field(() => Int, { description: 'total page of a list data' })
  totalPage: number;
}
