import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UploadFileService } from './upload-file.service';
import { UploadFile } from './entities/upload-file.entity';
import { UploadInputArgs } from './dto/upload-input.args';
import { CloudinaryResponseDto } from './dto/cloudinary-response.dto';

@Resolver(() => UploadFile)
export class UploadFileResolver {
  constructor(private readonly uploadFileService: UploadFileService) {}

  // @Mutation(() => String)
  // async uploadSingleFile(
  //   @Args('image', { type: () => GraphQLUpload }) image: Promise<Upload>,
  //   @Args('type', { type: () => ImageTypes }) type: ImageTypes,
  // ): Promise<string> {
  //   return this.uploadFileService.uploadImage(image, type);
  // }
  @Mutation(() => CloudinaryResponseDto, { name: 'uploadSingleFile' })
  async uploadSingleFile(
    @Args() args: UploadInputArgs,
  ): Promise<CloudinaryResponseDto> {
    return this.uploadFileService.uploadSingleFile(args);
  }
}
