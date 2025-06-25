import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Gallerypost } from './gallerypost.schema';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  author: string;  // 또는 사용자 ObjectId로도 가능

  @Prop({ type: Types.ObjectId, ref: 'Gallerypost', required: true })
  gallerypost: Types.ObjectId;  // 댓글이 속한 게시글 참조
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
