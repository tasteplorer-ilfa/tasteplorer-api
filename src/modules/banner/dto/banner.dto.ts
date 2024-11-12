import { MetaData } from '@common/dto/metaData.dto';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BannerDto {
  constructor(entity: BannerDto) {
    Object.assign(this, entity);
  }

  @Field(() => ID, { description: 'Banner ID' })
  id: number;

  @Field(() => String, { description: 'Banner Title' })
  title: string;

  @Field(() => String, { description: 'Banner Image' })
  image: string;

  @Field(() => String, { description: 'Banner Created At' })
  createdAt: string;

  @Field(() => String, { description: 'Banner Updated At' })
  updatedAt: string;

  @Field(() => Date, { description: 'Banner Deleted At', nullable: true })
  deletedAt?: Date;
}

@ObjectType()
export class BannerListDto {
  constructor(data: any) {
    Object.assign(this, data);
  }

  @Field(() => [BannerDto], { description: 'Banner List Data' })
  banners: BannerDto[];

  @Field(() => MetaData, { description: 'Banner Metadata' })
  meta: MetaData;
}
