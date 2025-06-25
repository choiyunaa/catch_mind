import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Gallerypost, GallerypostDocument } from './schema/gallerypost.schema';
import { CreateGallerypostDto, AddCommentDto } from './dto/create-gallerypost.dto';

@Injectable()
export class GallerypostService {
  constructor(
    @InjectModel(Gallerypost.name)
    private readonly gallerypostModel: Model<GallerypostDocument>,
  ) {}

  async create(dto: CreateGallerypostDto & { images: string[] }): Promise<Gallerypost> {
    const post = new this.gallerypostModel(dto);
    return post.save();
  }

  async findAll() {
  return this.gallerypostModel
    .find()
    .populate('userId', 'nickname') // userId를 nickname만 포함해서 조인
    .sort({ createdAt: -1 }); // 최신순 정렬
}

  async findMyPosts(userId: string): Promise<Gallerypost[]> {
    return this.gallerypostModel.find({ userId }).exec();
  }


async findById(id: string) {
  return this.gallerypostModel
    .findById(id)
    .populate('userId', 'nickname')
    .lean()
    .exec()
    .then(post => {
      if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

      const user = post.userId as unknown as { _id: string; nickname: string };

      return {
        ...post,
        nickname: user.nickname,
        userId: user._id,
      };
    });
}



  async addComment(id: string, commentDto: AddCommentDto, author: string): Promise<Gallerypost> {
    const post = await this.gallerypostModel.findById(id);
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    post.comments.push({
      author: commentDto.author,
      content: commentDto.content,
      createdAt: commentDto.createdAt ? new Date(commentDto.createdAt) : new Date(),
    });

    return post.save();
  }

  async toggleLike(postId: string, userId: string): Promise<Gallerypost> {
    const post = await this.gallerypostModel.findById(postId);
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    const index = post.likedUserIds.indexOf(userId);
    if (index === -1) {
      post.likedUserIds.push(userId); // 추천 추가
    } else {
      post.likedUserIds.splice(index, 1); // 추천 취소
    }

    return post.save();
  }
}
