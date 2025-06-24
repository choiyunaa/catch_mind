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

  async verifyUserInRoom(roomId: string, userId: string): Promise<boolean> {
  const room = await this.roomModel.findOne({ roomId });
  if (!room) return false;

  return room.players.some((p) => p.userId === userId);
}

async getRoomDrawings(roomId: string): Promise<string[]> {
  const room = await this.roomModel.findOne({ roomId }).lean();
  return room?.drawings || [];
}
}
