import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsModule } from './room/rooms.module';
import { AuthModule } from './auth/auth.module';
import { GameGateway } from './game/game.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    RoomsModule,
    AuthModule,
  ],
  providers: [GameGateway],
})
export class AppModule {}
