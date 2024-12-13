import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { ExpressAdapter } from '@nestjs/platform-express';

import express from 'express';
const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const configService = app.get(ConfigService);

  // TODO: Will Implement in next future
  // app.enableCors();

  app.use((req: any, res: any, next: any) => {
    if (req.url.includes('/graphql')) {
      // only graphql request
      graphqlUploadExpress({
        maxFileSize: 5 * 1024 * 1024, // maxfilesize is 5mb
        maxFiles: 10,
      })(req, res, next);
    } else {
      next();
    }
  });

  await app.listen(configService.get('PORT'));

  console.log(`Application is running on ${await app.getUrl()} 🚀`);
}
bootstrap();

export default server;
