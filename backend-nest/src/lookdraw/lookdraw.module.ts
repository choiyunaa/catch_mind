// src/lookdraw/lookdraw.module.ts
import { Module } from '@nestjs/common';
import { LookDrawController } from './lookdraw.controller';
import { LookDrawService } from './lookdraw.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from '../room/schemas/room.schema';
import { AuthModule } from '../auth/auth.module';  // AuthModule 임포트

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    AuthModule,  // AuthModule 임포트해서 JwtService 사용 가능하게 함
  ],
  controllers: [LookDrawController],
  providers: [LookDrawService],
})
export class LookDrawModule {}
