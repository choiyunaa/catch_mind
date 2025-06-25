// src/lookdraw/lookdraw.controller.ts

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LookDrawService } from './lookdraw.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { join, extname } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('lookdraw')
export class LookDrawController {
  constructor(private readonly lookDrawService: LookDrawService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':roomId')
  async getDrawings(@Param('roomId') roomId: string, @Req() req) {
    const userId = req.user.id;

    const hasAccess = await this.lookDrawService.verifyUserInRoom(roomId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('이 방에 접근할 수 없습니다.');
    }

    const uploadDir = join(__dirname, '..', '..', 'uploads', roomId);
    if (!existsSync(uploadDir)) {
      return { drawings: [] };
    }

    const files = readdirSync(uploadDir)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .sort((a, b) => {
        const aNum = parseInt(a.split('.')[0]);
        const bNum = parseInt(b.split('.')[0]);
        return aNum - bNum;
      });

    const drawings = files.map(
      filename => `http://localhost:9999/uploads/${roomId}/${filename}`,
    );
    return { drawings };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload/:roomId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            const roomId = req.params.roomId;
            if (!roomId) {
              console.error('roomId가 없음');
              return cb(new Error('roomId is required'), '');
            }
            const uploadPath = join(__dirname, '..', '..', 'uploads', roomId);
            if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
          } catch (e) {
            console.error('destination 설정 오류:', e);
            cb(e, '');
          }
        },
        filename: (req, file, cb) => {
          try {
            const timestamp = Date.now();
            const ext = extname(file.originalname);
            cb(null, `${timestamp}${ext}`);
          } catch (e) {
            console.error('filename 설정 오류:', e);
            cb(e, '');
          }
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(png|jpg|jpeg)$/)) {
          return cb(new ForbiddenException('이미지 파일만 업로드 가능합니다.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('roomId') roomId: string,
  ) {
    console.log('uploadFile 호출, file:', file, 'roomId:', roomId);
    if (!file) {
      throw new ForbiddenException('파일 업로드 실패');
    }
    const url = `http://localhost:9999/uploads/${roomId}/${file.filename}`;
    return { url };
  }
}
