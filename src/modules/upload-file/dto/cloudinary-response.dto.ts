import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CloudinaryResponseDto {
  constructor(entity: CloudinaryResponseDto) {
    Object.assign(this, entity);
  }

  @Field(() => Boolean, {
    description: 'The status of sucessfully upload image to cloudinary',
  })
  isSuccess: boolean;

  @Field(() => String, {
    description:
      'The image url of the image that already success uploaded to cloudinary',
  })
  imageUrl: string;
}
