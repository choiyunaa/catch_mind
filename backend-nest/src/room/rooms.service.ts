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
  private roomStates = new Map<
    string,
    {
      isStarted: boolean;
      currentWord?: string;
      maxRounds?: number;
      currentRound?: number;
      drawer?: Player;
      roundTimeout?: NodeJS.Timeout;
    }
  >();

  // 정답자 및 점수 저장용 맵
  private lastCorrectUserId: Map<string, string | null> = new Map();
  private lastGainedScore: Map<string, number> = new Map();

  setIo(io: Server) {
    this.io = io;
  }

  async findPublicRooms(): Promise<any[]> {

    console.log(`[findPublicRooms] roomStates keys:`, [...this.roomStates.keys()]);

  // DB에서 모든 공개방 가져오기 (status 조건 삭제)
  const rooms = await this.roomModel
    .find({ isPrivate: false }) 
    .lean()
    .exec();

  return rooms.map((room) => {
  const players = this.roomPlayers.get(room.roomId) || [];
  const isStarted = this.roomStates.get(room.roomId)?.isStarted;
  const status = isStarted ? 'playing' : room.status;

  return {
    ...room,
    players,         // 서버의 최신 players로 덮어쓰기
    status           // 이 줄이 반드시 ...room **뒤에** 있어야 함!
  };
});
}


  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
  const roomId = await this.generateRoomIdUnique();
  const createdRoom = new this.roomModel({
    ...createRoomDto,
    roomId,
    players: [],
    status: RoomStatus.Waiting,
    maxPlayers: 3,
  });
  return createdRoom.save();
}


  addUserToRoom(roomId: string, userId: string, nickname: string, socketId: string) {
    const players = this.roomPlayers.get(roomId) || [];
    if (players.find((p) => p.userId === userId)) return;

if (players.length >= 3) {
  this.io.to(socketId).emit('room:joinFailed', { reason: '정원이 모두 찼습니다.' });
  return;
}


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
      const index = players.findIndex((p) => p.clientId === socketId);
      if (index !== -1) {
        const [removedPlayer] = players.splice(index, 1);
        if (players.length === 0) {
          this.roomPlayers.delete(roomId);
          this.roomStates.delete(roomId);
          this.lastCorrectUserId.delete(roomId);
          this.lastGainedScore.delete(roomId);
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
console.log('[startGame] before set:', roomId, this.roomStates.get(roomId));
  
  this.roomStates.set(roomId, { isStarted: true, maxRounds: 3, currentRound: round });
  
  console.log('[startGame] after set:', roomId, this.roomStates.get(roomId));
    console.log(`[startGame] roomId: ${roomId}, current roomStates:`, this.roomStates.get(roomId));

    // 다시하기 시 상태 초기화
    this.lastCorrectUserId.delete(roomId);
    this.lastGainedScore.delete(roomId);

    const players = this.roomPlayers.get(roomId);
    if (players) {
      players.forEach((p) => (p.score = 0)); // 점수 초기화
      this.roomPlayers.set(roomId, players);
    }

    this.roomStates.set(roomId, { isStarted: true, maxRounds: 3, currentRound: round });
    this.io.to(roomId).emit('game:countdown');
    setTimeout(() => this.startRound(roomId), 3000);
  }

  private startRound(roomId: string) {
    const roomState = this.roomStates.get(roomId);
    const players = this.roomPlayers.get(roomId) || [];

    if (
      !roomState ||
      !roomState.isStarted ||
      players.length === 0 ||
      (roomState.currentRound !== undefined &&
        roomState.maxRounds !== undefined &&
        roomState.currentRound > roomState.maxRounds)
    ) {
      this.endGame(roomId);
      return;
    }

    const drawerIndex = ((roomState.currentRound ?? 1) - 1) % players.length;
    const drawer = players[drawerIndex];
    const word = this.getRandomWord();

    this.roomStates.set(roomId, { ...roomState, drawer, currentWord: word });

    this.io.to(roomId).emit('gameStarted', {
      drawer,
      endTime: new Date(Date.now() + 5000).toISOString(),
      round: roomState.currentRound,
      maxRounds: roomState.maxRounds,
    });
    this.io.to(drawer.clientId).emit('word', { word, userId: drawer.userId });

    const roundTimeout = setTimeout(() => this.endRound(roomId), 5000);
    const updatedRoomState = this.roomStates.get(roomId);
    if (updatedRoomState) {
      updatedRoomState.roundTimeout = roundTimeout;
      this.roomStates.set(roomId, updatedRoomState);
    }
  }

  private endRound(roomId: string) {
    const roomState = this.roomStates.get(roomId);
    if (!roomState || !roomState.isStarted) return;

    if (roomState.roundTimeout) {
      clearTimeout(roomState.roundTimeout);
    }

    const players = this.getPlayersInRoom(roomId);

    const correctUserId = this.lastCorrectUserId.get(roomId) || null;
    const gainedScore = this.lastGainedScore.get(roomId) || 0;

    const correctUserNickname =
      correctUserId !== null
        ? players.find((p) => p.userId === correctUserId)?.nickname || null
        : null;

    this.io.to(roomId).emit('roundSummary', {
      word: roomState.currentWord,
      players,
      correctUser: correctUserNickname, // 닉네임 보내기
      gainedScore,
    });

    // 상태 초기화
    this.lastCorrectUserId.delete(roomId);
    this.lastGainedScore.delete(roomId);

    roomState.currentRound = (roomState.currentRound ?? 1) + 1;
    this.roomStates.set(roomId, roomState);

    if (roomState.currentRound > (roomState.maxRounds ?? 3)) {
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
    const correctPlayer = players?.find((p) => p.userId === userId);
    const roomState = this.roomStates.get(roomId);

    if (correctPlayer && roomState && roomState.isStarted) {
      correctPlayer.score += 10;

      // 정답자 및 점수 저장
      this.lastCorrectUserId.set(roomId, userId);
      this.lastGainedScore.set(roomId, 10);

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
      if (!(await this.roomModel.findOne({ roomId }))) return roomId;
    }
  }
}
