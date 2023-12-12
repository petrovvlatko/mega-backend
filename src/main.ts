import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const allowedOrigins =
    process.env.ENVIRONMENT === 'development'
      ? '*'
      : process.env.ENVIRONMENT === 'preprod' ||
          process.env.ENVIRONMENT === 'prod'
        ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
        : [];

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(cookieParser());

  // Set views engine with handlebars
  app.useStaticAssets('src/public');
  app.setBaseViewsDir('src/views');
  app.setViewEngine('hbs');

  // Remember to ensure that only specific origins can communicate with your API!!!
  // Use comma separated origins with the ALLOWED_ORIGINS environment variable
  app.enableCors({
    allowedHeaders:
      'Content-Type, Accept, Access-Control-Allow-Origin, Authorization',
    origin: allowedOrigins,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: 'Authorization, Access-Control-Allow-Origin',
  });

  await app.listen(PORT);
}
bootstrap();
