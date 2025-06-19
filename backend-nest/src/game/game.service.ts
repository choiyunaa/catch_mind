import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

interface Player {
  userId: string;
  nickname: string;
  isHost?: boolean;
}

@Injectable()
export class GameService {
  private roomId: string;
  private players: Player[] = [];
  private drawer: Player | null = null;
  private word: string = '';
  private endTime: Date | null = null;
  private io: Server;
  private round = 0;
  private maxRounds = 3;
  private isGameStarted = false;

  constructor() {}

  // Socket.IO 서버 객체 세팅 (외부에서 주입 가능)
  setIo(io: Server) {
    this.io = io;
  }

  setRoomId(roomId: string) {
    this.roomId = roomId;
  }

  addPlayer(player: Player) {
    if (!this.players.find(p => p.userId === player.userId)) {
      this.players.push(player);
    }
  }

  removePlayer(userId: string) {
    this.players = this.players.filter(p => p.userId !== userId);
    if (this.drawer?.userId === userId) {
      this.endRound();
    }
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

    const drawerIndex = (this.round - 1) % this.players.length;
    this.drawer = this.players[drawerIndex];

    this.word = this.getRandomWord();

    this.endTime = new Date(Date.now() + 120000);

    this.io.to(this.roomId).emit('gameStarted', {
      drawer: this.drawer,
      endTime: this.endTime.toISOString(),
      round: this.round,
      maxRounds: this.maxRounds,
    });

    this.io.to(this.drawer.userId).emit('word', {
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
      players: this.players,
    });
  }

  private getRandomWord(): string {
    const words = ['사과', '자동차', '컴퓨터', '축구', '바다'];
    return words[Math.floor(Math.random() * words.length)];
  }
}
