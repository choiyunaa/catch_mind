import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomsService } from '../room/rooms.service';

interface Player {
  clientId: string;
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
  lastMessage?: string;
}

interface GameState {
  drawer: Player | null;
  word: string;
  endTime: Date | null;
  round: number;
  maxRounds: number;
  isGameStarted: boolean;
  isRoundActive: boolean;
  correctUser: Player | null;
  gainedScore: number;
  roundTimeout?: NodeJS.Timeout;
  countdownTimeout?: NodeJS.Timeout;
}

@Injectable()
export class GameService {
  constructor(
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService
  ) {}

  private io: Server;
  private gameStates = new Map<string, GameState>();
  private readonly words = ['사과', '바나나', '강아지', '축구', '컴퓨터'];

  setIo(io: Server) {
    this.io = io;
  }

  getPlayers(roomId: string): Player[] {
    return this.roomsService.getPlayersInRoom(roomId);
  }

  getCurrentWord(roomId: string): string | null {
    const state = this.gameStates.get(roomId);
    return state ? state.word : null;
  }

  startGame(roomId: string, round: number = 1) {
    let state = this.gameStates.get(roomId);
    if (!state) {
      state = this.createNewGameState();
      this.gameStates.set(roomId, state);
    }

    const players = this.getPlayers(roomId);
    if (players.length < 2) {
      this.io.to(roomId).emit('room:update', {
        players,
        currentRound: state.round,
        maxRounds: state.maxRounds,
        currentDrawer: null,
        status: 'waiting',
        currentWord: '',
        message: '최소 2명 이상이어야 게임을 시작할 수 있습니다.',
      });
      return;
    }

    if (state.isGameStarted) return;

    state.isGameStarted = true;
    state.round = 1;
    state.maxRounds = 3;
    this.gameStates.set(roomId, state);

    this.io.to(roomId).emit('game:countdown');

    if (state.countdownTimeout) clearTimeout(state.countdownTimeout);
    state.countdownTimeout = setTimeout(() => this.startRound(roomId), 3000);
  }

  startNextRound(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;
    this.startRound(roomId);
  }

  private startRound(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;

    const players = this.getPlayers(roomId);
    if (state.round > state.maxRounds || players.length < 2) {
      this.endGame(roomId);
      return;
    }

    state.isRoundActive = true;
    const drawerIndex = (state.round - 1) % players.length;
    state.drawer = players[drawerIndex];
    state.word = this.getRandomWord();
    state.endTime = new Date(Date.now() + 3000); 

    this.io.to(roomId).emit('gameStarted', {
      drawer: state.drawer,
      endTime: state.endTime.toISOString(),
      round: state.round,
      maxRounds: state.maxRounds,
    });

    this.io.to(state.drawer.clientId).emit('word', {
      userId: state.drawer.userId,
      word: state.word,
    });

    if (state.roundTimeout) clearTimeout(state.roundTimeout);
    state.roundTimeout = setTimeout(() => {
      this.endRound(roomId);
    }, 3000);
  }

  private endRound(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;

    state.isRoundActive = false;
    const players = this.getPlayers(roomId);
    const currentRound = state.round;

    const isLastRound = state.round >= state.maxRounds;
    this.io.to(roomId).emit('roundSummary', {
      round: currentRound,
      correctUser: state.correctUser?.nickname || null,
      word: state.word,
      gainedScore: state.gainedScore,
      players,
      isLastRound,
    });

    state.correctUser = null;
    state.gainedScore = 0;
    state.word = '';

    if (!isLastRound) {
      state.round++;
    }

    if (state.roundTimeout) clearTimeout(state.roundTimeout);
  }

  handleCorrectAnswer(roomId: string, userId: string) {
    const state = this.gameStates.get(roomId);
    if (!state || !state.isRoundActive) return;

    const players = this.getPlayers(roomId);
    const correctPlayer = players.find(p => p.userId === userId);

    if (correctPlayer) {
      const score = 10;
      correctPlayer.score += score;
      state.correctUser = correctPlayer;
      state.gainedScore = score;

      if (state.roundTimeout) clearTimeout(state.roundTimeout);
      this.endRound(roomId);
    }
  }

  private endGame(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;
    const players = this.getPlayers(roomId);
    state.isGameStarted = false;
    state.isRoundActive = false;

    this.io.to(roomId).emit('gameEnd', { players });
    this.clearGameState(roomId);
  }

  private getRandomWord(): string {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  private createNewGameState(): GameState {
    return {
      drawer: null,
      word: '',
      endTime: null,
      round: 0,
      maxRounds: 3,
      isGameStarted: false,
      isRoundActive: false,
      correctUser: null,
      gainedScore: 0,
    };
  }

  private clearGameState(roomId: string) {
    this.gameStates.delete(roomId);
  }

  getDrawerUserId(roomId: string): string | null {
    const state = this.gameStates.get(roomId);
    return state?.drawer?.userId || null;
  }

  resetRoom(roomId: string) {
    const players = this.getPlayers(roomId);
    let state = this.gameStates.get(roomId);
    if (!state) {
      state = this.createNewGameState();
      this.gameStates.set(roomId, state);
    }

    players.forEach(p => (p.score = 0));
    state.round = 1;
    state.maxRounds = 3;
    state.isGameStarted = false;
    state.isRoundActive = false;
    state.correctUser = null;
    state.gainedScore = 0;
    state.drawer = null;
    state.word = '';
    state.endTime = null;

    if (state.roundTimeout) clearTimeout(state.roundTimeout);
    if (state.countdownTimeout) clearTimeout(state.countdownTimeout);

    this.io.to(roomId).emit('room:update', {
      players,
      currentRound: state.round,
      maxRounds: state.maxRounds,
      currentDrawer: null,
      status: 'waiting',
      currentWord: '',
    });
  }
}
