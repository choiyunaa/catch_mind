// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // NestExpressApplication으로 생성
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 제공 (uploads 폴더)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // URL 경로는 http://localhost:9999/uploads/...
  });

  // CORS 설정: React 개발 서버 (3000) 허용
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // WebSocket 어댑터 설정
  app.useWebSocketAdapter(new IoAdapter(app));

  // 전역 API prefix
  app.setGlobalPrefix('api'); // 예: GET /api/auth/login

  // 전역 유효성 검사 파이프 설정
  app.useGlobalPipes(new ValidationPipe());

  // 서버 실행
  const port = 9999;
  await app.listen(port);
  console.log(`✅ Server running at: http://localhost:${port}`);
}

bootstrap();
