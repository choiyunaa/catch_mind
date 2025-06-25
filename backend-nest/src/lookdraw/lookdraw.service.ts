// src/lookdraw/lookdraw.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Room, RoomDocument } from '../room/schemas/room.schema';
import { Model } from 'mongoose';

@Injectable()
export class LookDrawService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  /**
   * 사용자가 해당 roomId 방에 참여한 적이 있는지 확인
   */
  async verifyUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) return false;

    return room.players.some((p) => p.userId === userId);
  }

  /**
   * 해당 방의 그림 리스트 (URL 또는 base64 string) 반환
   */
  async getRoomDrawings(roomId: string): Promise<string[]> {
    const room = await this.roomModel.findOne({ roomId }).lean();
    return room?.drawings || [];
  }
}
