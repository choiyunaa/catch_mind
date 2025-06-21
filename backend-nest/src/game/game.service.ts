import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

interface Player {
  clientId: string;
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
  lastMessage?: string;
}

@Injectable()
export class GameService {
  private players = new Map<string, Player[]>(); // roomId -> players
  private drawer: Player | null = null;
  private roomId: string;
  private word: string = '';
  private endTime: Date | null = null;
  private io: Server;
  private round = 0;
  private maxRounds = 3;
  private isGameStarted = false;

  setIo(io: Server) {
    this.io = io;
  }

  setRoomId(roomId: string) {
    this.roomId = roomId;
  }

  addPlayer(roomId: string, playerInfo: { clientId: string; userId: string; nickname: string }) {
    const roomPlayers = this.players.get(roomId) || [];
    if (roomPlayers.find(p => p.userId === playerInfo.userId)) return; // 중복 방지

    const newPlayer: Player = {
      ...playerInfo,
      isHost: roomPlayers.length === 0,
      score: 0,
    };

    roomPlayers.push(newPlayer);
    this.players.set(roomId, roomPlayers);
  }

  removePlayerByClientId(clientId: string): { roomId: string; wasHost: boolean } | null {
    for (const [roomId, roomPlayers] of this.players.entries()) {
      const idx = roomPlayers.findIndex(p => p.clientId === clientId);
      if (idx !== -1) {
        const [removed] = roomPlayers.splice(idx, 1);
        this.players.set(roomId, roomPlayers);
        if (removed.isHost && roomPlayers.length > 0) {
          roomPlayers[0].isHost = true;
        }
        return { roomId, wasHost: removed.isHost };
      }
    }
    return null;
  }

  getPlayers(roomId: string): Player[] {
    return this.players.get(roomId) || [];
  }

  startGame() {
    if (this.isGameStarted) return;
    this.isGameStarted = true;
    this.round = 1;

    this.io.to(this.roomId).emit('game:countdown');

    setTimeout(() => this.startRound(), 3000);
  }

  private startRound() {
    if (this.round > this.maxRounds) {
      this.endGame();
      return;
    }

    const players = this.players.get(this.roomId) || [];
    if (players.length === 0) {
      this.endGame();
      return;
    }

    const drawerIndex = (this.round - 1) % players.length;
    this.drawer = players[drawerIndex];
    this.word = this.getRandomWord();
    this.endTime = new Date(Date.now() + 120000);

    this.io.to(this.roomId).emit('gameStarted', {
      drawer: this.drawer,
      endTime: this.endTime.toISOString(),
      round: this.round,
      maxRounds: this.maxRounds,
    });

    this.io.to(this.drawer.clientId).emit('word', {
      userId: this.drawer.userId,
      word: this.word,
    });
  }

  private endRound() {
    this.round++;
    if (this.round <= this.maxRounds) {
      this.startRound();
    } else {
      this.endGame();
    }
  }

  private endGame() {
    this.isGameStarted = false;
    this.io.to(this.roomId).emit('gameEnd', {
      players: this.players.get(this.roomId) || [],
    });
  }

  private getRandomWord(): string {
    const words = ['사과', '자동차', '컴퓨터', '축구', '바다'];
    return words[Math.floor(Math.random() * words.length)];
  }
}
