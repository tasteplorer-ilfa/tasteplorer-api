import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MetaData {
  @Field(() => Int, { nullable: true, description: 'page size of a list data' })
  pageSize?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'current page of a list data',
  })
  currentPage?: number;

  @Field(() => Int, { description: 'total data of list data' })
  total: number;

  @Field(() => Int, {
    nullable: true,
    description: 'total page of a list data',
  })
  totalPage?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Base64 encoded cursor of last item',
  })
  endCursor?: string;

  @Field(() => Boolean, { nullable: true, description: 'Is there next page?' })
  hasNextPage?: boolean;
}
