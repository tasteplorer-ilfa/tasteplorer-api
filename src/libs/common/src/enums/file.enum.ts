import { registerEnumType } from '@nestjs/graphql';

export enum EnumFolder {
  ARTICLE = 'articles',
  BANNER = 'banners',
  RECIPE = 'recipes',
  USER = 'users',
}

export enum EnumService {
  Cloudinary = 'Cloudinary',
  S3Storage = 'S3storage',
  Web3Storage = 'Web3storage',
}

// Register the enum type to be used in GraphQL schema
registerEnumType(EnumFolder, {
  name: 'EnumFolder',
  description: 'Folders in Cloudinary where images can be uploaded',
});

registerEnumType(EnumService, {
  name: 'EnumService',
  description: 'Enum service which storage service that will be used',
});
