import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';

export type GallerypostDocument = Gallerypost & Document;

@Schema({ timestamps: true })
export class Gallerypost {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
userId: User;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 0 })
  likes: number;

  @Prop({
  type: [
    {
      author: String,
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  default: [],
})
comments: {
  author: string;
  content: string;
  createdAt: Date;
}[];


@Prop({ type: [String], default: [] })
likedUserIds: string[];



}

export const GallerypostSchema = SchemaFactory.createForClass(Gallerypost);
