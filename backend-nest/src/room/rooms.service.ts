import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  // --- MongoDB 관련 메서드 ---
  async findPublicRooms(): Promise<Room[]> {
    return this.roomModel.find({ isPrivate: false, status: RoomStatus.Waiting }).exec();
  }

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    const roomId = await this.generateRoomIdUnique();

    const createdRoom = new this.roomModel({
      roomId,
      title: createRoomDto.title,
      maxPlayers: createRoomDto.maxPlayers,
      isPrivate: createRoomDto.isPrivate,
      players: [{
        userId: createRoomDto.userId,
        nickname: createRoomDto.nickname,
        isHost: true,
        score: 0,
      }],
      status: RoomStatus.Waiting,
      currentRound: 0,
      maxRounds: 5,
      currentDrawer: null,
      currentWord: null,
      startTime: null,
      endTime: null,
    });
    return createdRoom.save();
  }

  // 중복되지 않는 roomId 생성 함수
  private async generateRoomIdUnique(length = 6): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    while (true) {
      let roomId = '';
      for (let i = 0; i < length; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existingRoom = await this.roomModel.findOne({ roomId });
      if (!existingRoom) return roomId;
      // 중복이면 다시 생성
    }
  }

  // --- WebSocket 접속 플레이어 목록 메모리 관리 ---

  // 방 ID(key) 당 접속 중인 플레이어 배열 (닉네임 + 소켓ID)
  private roomPlayers: Map<string, { nickname: string; socketId: string }[]> = new Map();

  // 플레이어 방에 추가 (중복 소켓ID는 추가 안 함)
  addUserToRoom(roomId: string, nickname: string, socketId: string) {
    const players = this.roomPlayers.get(roomId) || [];
    if (!players.find((p) => p.socketId === socketId)) {
      players.push({ nickname, socketId });
      this.roomPlayers.set(roomId, players);
    }
  }

  // 특정 방의 플레이어 닉네임 목록 조회
  getPlayersInRoom(roomId: string): string[] {
    const players = this.roomPlayers.get(roomId) || [];
    return players.map((p) => p.nickname);
  }

  // 소켓ID로 방에서 플레이어 제거, 제거한 방ID 반환 (없으면 null)
  removeUserFromRoom(socketId: string): string | null {
    for (const [roomId, players] of this.roomPlayers.entries()) {
      const filtered = players.filter((p) => p.socketId !== socketId);
      if (filtered.length !== players.length) {
        this.roomPlayers.set(roomId, filtered);
        return roomId;
      }
    }
    return null;
  }
}
