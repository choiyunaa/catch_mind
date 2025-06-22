import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import words from './words';

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
  private correctUser: Player | null = null;
  private gainedScore: number = 0;

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

  startGame(roomId: string, round: number = 1) {
    this.roomId = roomId;
    if (this.isGameStarted) return;
    this.isGameStarted = true;
    this.round = round;

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
    this.endTime = new Date(Date.now() + 120000); // 2분 후

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

    // 2분 후 자동으로 라운드 종료
    setTimeout(() => this.endRound(), 120000);
  }

  private endRound() {
    const players = this.getPlayers(this.roomId);

    // 라운드 요약 데이터 준비
    this.io.to(this.roomId).emit('roundSummary', {
      correctUser: this.correctUser?.nickname || null,
      word: this.word,
      gainedScore: this.gainedScore,
      players,
    });

    // 정답자 초기화
    this.correctUser = null;
    this.gainedScore = 0;

    // 5초 후 다음 라운드 시작
    setTimeout(() => {
      this.round++;
      if (this.round <= this.maxRounds) {
        this.startRound();
      } else {
        this.endGame();
      }
    }, 5000);
  }

  handleCorrectAnswer(userId: string) {
    const players = this.players.get(this.roomId);
    const correctPlayer = players?.find(p => p.userId === userId);
    if (correctPlayer) {
      const score = 100;
      correctPlayer.score += score;

      this.correctUser = correctPlayer;
      this.gainedScore = score;

      this.endRound();
    }
  }

  private endGame() {
    this.isGameStarted = false;
    this.io.to(this.roomId).emit('gameEnd', {
      players: this.players.get(this.roomId) || [],
    });
  }

  private getRandomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
  }
}
