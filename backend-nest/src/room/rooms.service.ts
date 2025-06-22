import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument, RoomStatus } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { Server } from 'socket.io';

interface Player {
  clientId: string;
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
}

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  private io: Server;
  private roomPlayers: Map<string, Player[]> = new Map();
  private roomStates = new Map<string, { isStarted: boolean; currentWord?: string; maxRounds?: number; currentRound?: number; drawer?: Player }>();

  setIo(io: Server) {
    this.io = io;
  }

  async findPublicRooms(): Promise<any[]> {
    const rooms = await this.roomModel.find({ isPrivate: false, status: RoomStatus.Waiting }).lean().exec();
    return rooms.map(room => ({
      ...room,
      players: this.roomPlayers.get(room.roomId) || [],
    }));
  }

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    const roomId = await this.generateRoomIdUnique();
    const createdRoom = new this.roomModel({
      ...createRoomDto,
      roomId,
      players: [],
      status: RoomStatus.Waiting,
    });
    return createdRoom.save();
  }

  addUserToRoom(roomId: string, userId: string, nickname: string, socketId: string) {
    const players = this.roomPlayers.get(roomId) || [];
    if (players.find(p => p.userId === userId) || players.length >= 4) return;

    const newPlayer: Player = {
      clientId: socketId,
      userId,
      nickname,
      isHost: players.length === 0,
      score: 0,
    };
    players.push(newPlayer);
    this.roomPlayers.set(roomId, players);
  }

  removeUserFromRoom(socketId: string): string | null {
    for (const [roomId, players] of this.roomPlayers.entries()) {
      const index = players.findIndex(p => p.clientId === socketId);
      if (index !== -1) {
        const [removedPlayer] = players.splice(index, 1);
        if (players.length === 0) {
          this.roomPlayers.delete(roomId);
          this.roomStates.delete(roomId);
        } else if (removedPlayer.isHost) {
          players[0].isHost = true;
        }
        this.roomPlayers.set(roomId, players);
        return roomId;
      }
    }
    return null;
  }

  getPlayersInRoom(roomId: string): Player[] {
    return this.roomPlayers.get(roomId) || [];
  }

  getCurrentWord(roomId: string): string | undefined {
    return this.roomStates.get(roomId)?.currentWord;
  }
  
  startGame(roomId: string, round: number = 1) {
    const roomState = this.roomStates.get(roomId);
    if (roomState?.isStarted) return;
  
    this.roomStates.set(roomId, { isStarted: true, maxRounds: 5, currentRound: round });
    this.io.to(roomId).emit('game:countdown');
    setTimeout(() => this.startRound(roomId), 3000);
  }

  private startRound(roomId: string) {
    const roomState = this.roomStates.get(roomId);
    const players = this.roomPlayers.get(roomId) || [];

    if (!roomState || !roomState.isStarted || players.length === 0 || roomState.currentRound > roomState.maxRounds) {
      this.endGame(roomId);
      return;
    }

    const drawerIndex = (roomState.currentRound - 1) % players.length;
    const drawer = players[drawerIndex];
    const word = this.getRandomWord();
    
    this.roomStates.set(roomId, { ...roomState, drawer, currentWord: word });

    this.io.to(roomId).emit('gameStarted', {
      drawer,
      endTime: new Date(Date.now() + 120000).toISOString(),
      round: roomState.currentRound,
      maxRounds: roomState.maxRounds,
    });
    this.io.to(drawer.clientId).emit('word', { word });

    const roundTimeout = setTimeout(() => this.endRound(roomId), 120000);
    this.roomStates.get(roomId)['roundTimeout'] = roundTimeout;
  }

  private endRound(roomId: string) {
    const roomState = this.roomStates.get(roomId);
    if (!roomState || !roomState.isStarted) return;
    
    if(roomState['roundTimeout']) {
      clearTimeout(roomState['roundTimeout']);
    }

    const players = this.getPlayersInRoom(roomId);
    this.io.to(roomId).emit('roundSummary', {
      word: roomState.currentWord,
      players: players,
    });

    roomState.currentRound++;
    if (roomState.currentRound > roomState.maxRounds) {
        setTimeout(() => this.endGame(roomId), 5000);
    } else {
        setTimeout(() => this.startRound(roomId), 5000);
    }
  }

  private endGame(roomId: string) {
    this.roomStates.set(roomId, { isStarted: false });
    this.io.to(roomId).emit('gameEnd', {
      players: this.getPlayersInRoom(roomId),
    });
  }

  handleCorrectAnswer(roomId: string, userId: string) {
    const players = this.roomPlayers.get(roomId);
    const correctPlayer = players?.find(p => p.userId === userId);
    const roomState = this.roomStates.get(roomId);

    if (correctPlayer && roomState && roomState.isStarted) {
      correctPlayer.score += 10;
      this.endRound(roomId);
    }
  }

  private getRandomWord(): string {
    const words = ['사과', '자동차', '축구', '바다'];
    return words[Math.floor(Math.random() * words.length)];
  }

  private async generateRoomIdUnique(length = 6): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    while (true) {
      let roomId = '';
      for (let i = 0; i < length; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!await this.roomModel.findOne({ roomId })) return roomId;
    }
  }
}
