import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsModule } from './room/rooms.module';
import { AuthModule } from './auth/auth.module';
import { GameGateway } from './game/game.gateway';
import { GameModule } from './game/game.module';
import { GallerypostModule } from './Gallerypost/gallerypost.module';
import { LookDrawModule } from './lookdraw/lookdraw.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [LookDrawModule, GameModule, ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    RoomsModule,
    AuthModule,
    GallerypostModule,
    LookDrawModule, 
    GameModule,
  ],
})
export class AppModule {}


