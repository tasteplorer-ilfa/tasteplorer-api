import { Module } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { UploadFileResolver } from './upload-file.resolver';

@Module({
  providers: [UploadFileResolver, UploadFileService],
})
export class UploadFileModule {}
