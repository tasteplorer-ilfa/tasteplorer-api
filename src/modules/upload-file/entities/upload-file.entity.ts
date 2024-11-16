import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class UploadFile {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
