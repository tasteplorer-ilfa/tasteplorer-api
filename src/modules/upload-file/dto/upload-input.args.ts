import { ArgsType, Field } from '@nestjs/graphql';
import { UploadParamInput } from './upload-type.dto';
import { GraphQLUpload, Upload } from 'graphql-upload-minimal';

@ArgsType()
export class UploadInputArgs {
  @Field(() => UploadParamInput, { nullable: false })
  setting!: UploadParamInput;

  @Field(() => GraphQLUpload)
  file!: Promise<Upload>;
}
