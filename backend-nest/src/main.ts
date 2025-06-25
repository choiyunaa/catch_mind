import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 제공 (uploads 폴더) + CORS 헤더 추가
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    },
  });

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  const port = 9999;
  await app.listen(port);
  console.log(`✅ Server running at: http://localhost:${port}`);
}

bootstrap();
