import { EnumFolder, EnumService } from '@common/enums/file.enum';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UploadParamInput {
  @Field(() => EnumService)
  uploadService!: EnumService;

  @Field(() => EnumFolder)
  folder!: EnumFolder;
}
