import {
  Controller,
  Post,
  Patch,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';

import { GallerypostService } from './gallerypost.service';
import { CreateGallerypostDto, AddCommentDto } from './dto/create-gallerypost.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface CustomRequest extends Request {
  user: {
    userId: string;
    username: string;
    nickname: string;
    iat?: number;
    exp?: number;
  };
}

@Controller('galleryposts')
export class GallerypostController {
  constructor(private readonly gallerypostService: GallerypostService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateGallerypostDto,
    @Req() req: CustomRequest,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : null;
    return this.gallerypostService.create({
      ...body,
      images: imageUrl ? [imageUrl] : [],
      userId: req.user.userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMyPosts(@Req() req: CustomRequest) {
    return this.gallerypostService.findMyPosts(req.user.userId);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.gallerypostService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() body: AddCommentDto,
    @Req() req: CustomRequest,
  ) {
    const author = req.user.nickname;
    return this.gallerypostService.addComment(id, body, author);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/like')
  async toggleLike(@Param('id') id: string, @Req() req: CustomRequest) {
    return this.gallerypostService.toggleLike(id, req.user.userId);
  }

  @Get()
  async findAll() {
    return this.gallerypostService.findAll();
  }
}
