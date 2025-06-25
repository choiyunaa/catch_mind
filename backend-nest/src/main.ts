import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // NestExpressApplication 타입으로 생성
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 제공 (uploads 폴더)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS 설정 (React와 통신 가능하도록)
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // WebSocket 어댑터 설정
  app.useWebSocketAdapter(new IoAdapter(app));

  // 글로벌 API prefix 설정
  app.setGlobalPrefix('api');

  // 글로벌 유효성 검사 파이프
  app.useGlobalPipes(new ValidationPipe());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});

  // 서버 포트 설정 및 시작
  const port = 9999;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
