import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { GraphQLError } from 'graphql';
import {
  CLOUDINARY_PRODUCTION,
  CLOUDINARY_STAGING,
} from '@common/constants/cloudinary';
import { generateRandomId } from '@common/utils/generateRandomId';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import { UploadInputArgs } from './dto/upload-input.args';
import { EnumService } from '@common/enums/file.enum';
import toStream from 'buffer-to-stream';
import { CloudinaryResponseDto } from './dto/cloudinary-response.dto';

@Injectable()
export class UploadFileService {
  constructor() {
    const configService = new ConfigService();

    cloudinary.v2.config({
      cloud_name: configService.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: configService.getOrThrow('CLOUDINARY_API_SECRET'),
    });
  }

  private readonly configService: ConfigService = new ConfigService();
  private readonly env =
    this.configService.getOrThrow('NODE_ENV') || 'developement';

  // private isValidImage(base64String: string): boolean {
  //   const imageRegex = /^data:image\/(png|jpeg|jpg|gif|bmp);base64,/;
  //   return imageRegex.test(base64String);
  // }

  async uploadSingleImage(fileStream: Readable, type: string): Promise<string> {
    const cloudinaryEnv =
      this.env === 'development' ? CLOUDINARY_STAGING : CLOUDINARY_PRODUCTION;

    // if (!this.isValidImage(fileStream)) {
    //   throw new GraphQLError(
    //     'Invalid image format. Only PNG, JPEG, GIF, or BMP images are allowed.',
    //   );
    // }

    // Cast the Readable stream to a ReadStream

    try {
      const stream = fileStream as ReadStream;
      const filename = generateRandomId();

      return new Promise((resolve, reject) => {
        const result = cloudinary.v2.uploader.upload_stream(
          {
            public_id: `${cloudinaryEnv}/${type}/${filename}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          },
        );

        // Pipe the file stream to cloudinary
        stream.pipe(result);
      });
    } catch (error) {
      throw new GraphQLError('Upload image failed ', error.message);
    }
  }

  async uploadSingleFile(
    args: UploadInputArgs,
  ): Promise<CloudinaryResponseDto> {
    if (args.setting.uploadService === EnumService.Cloudinary) {
      try {
        const upload = await this.uploadSingleToCloudinaryGraphql(args);

        return new CloudinaryResponseDto({
          isSuccess: true,
          imageUrl: upload.secure_url,
        });
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    }

    if (args.setting.uploadService === EnumService.S3Storage) {
      return;
    }

    if (args.setting.uploadService === EnumService.Web3Storage) {
      return;
    }
  }

  async uploadSingleToCloudinaryGraphql(args: any): Promise<any> {
    const { createReadStream } = await args.file;
    const buffer = await this.streamToBuffer(createReadStream());
    return this.cloudinary(buffer, args.setting.folder);
  }

  async streamToBuffer(stream: Readable): Promise<Buffer> {
    const buffer: Uint8Array[] = [];

    return new Promise((resolve, reject) =>
      stream
        .on('error', (error) => reject(error))
        .on('data', (data) => buffer.push(data))
        .on('end', () => resolve(Buffer.concat(buffer))),
    );
  }

  async cloudinary(buffer: any, folder: any) {
    const filename = generateRandomId();
    const cloudinaryEnv =
      this.env === 'development' ? CLOUDINARY_STAGING : CLOUDINARY_PRODUCTION;

    return await new Promise((resolve, reject) => {
      const upload = cloudinary.v2.uploader.upload_stream(
        { public_id: `${cloudinaryEnv}/${folder}/${filename}` },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        },
      );
      toStream(buffer).pipe(upload);
    });
  }
}
