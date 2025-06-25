import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gallerypost, GallerypostSchema } from './schema/gallerypost.schema';
import { GallerypostService } from './gallerypost.service';
import { GallerypostController } from './gallerypost.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gallerypost.name, schema: GallerypostSchema },
    ]),
     AuthModule, 
  ],
  providers: [GallerypostService],
  controllers: [GallerypostController],
})
export class GallerypostModule {}
