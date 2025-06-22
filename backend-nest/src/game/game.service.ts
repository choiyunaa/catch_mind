// src/game/game.service.ts
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

interface GameState {
  players: Player[];
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
  private io: Server;
  private gameStates = new Map<string, GameState>(); // roomId -> GameState

  // 임시 단어 리스트 5개만
  private readonly words = ['사과', '바나나', '강아지', '축구', '컴퓨터'];

  setIo(io: Server) {
    this.io = io;
  }

  addPlayer(roomId: string, playerInfo: { clientId: string; userId: string; nickname: string }) {
    const state = this.gameStates.get(roomId) || this.createNewGameState();
    if (state.players.find(p => p.userId === playerInfo.userId)) return; // 중복 방지

    const newPlayer: Player = {
      ...playerInfo,
      isHost: state.players.length === 0,
      score: 0,
    };

    state.players.push(newPlayer);
    this.gameStates.set(roomId, state);
  }

  removePlayerByClientId(clientId: string): { roomId: string; wasHost: boolean } | null {
    for (const [roomId, state] of this.gameStates.entries()) {
      const idx = state.players.findIndex(p => p.clientId === clientId);
      if (idx !== -1) {
        const [removed] = state.players.splice(idx, 1);
        if (removed.isHost && state.players.length > 0) {
          state.players[0].isHost = true;
        }
        // 플레이어 전부 나가면 상태 초기화
        if (state.players.length === 0) {
          this.clearGameState(roomId);
        }
        return { roomId, wasHost: removed.isHost };
      }
    }
    return null;
  }

  getPlayers(roomId: string): Player[] {
    const state = this.gameStates.get(roomId);
    return state ? state.players : [];
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

    if (state.isGameStarted) return;

    state.isGameStarted = true;
    state.round = round;
    state.maxRounds = 3;

    this.gameStates.set(roomId, state);

    this.io.to(roomId).emit('game:countdown');

    if (state.countdownTimeout) clearTimeout(state.countdownTimeout);
    state.countdownTimeout = setTimeout(() => this.startRound(roomId), 3000);
  }

  private startRound(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;

    if (state.round > state.maxRounds) {
      this.endGame(roomId);
      return;
    }

    if (state.players.length === 0) {
      this.endGame(roomId);
      return;
    }

    state.isRoundActive = true;

    const drawerIndex = (state.round - 1) % state.players.length;
    state.drawer = state.players[drawerIndex];
    state.word = this.getRandomWord();
    state.endTime = new Date(Date.now() + 120000); // 2분 타임아웃

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
      if (state.isRoundActive) {
        this.endRound(roomId);
      }
    }, 120000);
  }

  private endRound(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;
    if (!state.isRoundActive) return;

    state.isRoundActive = false;

    this.io.to(roomId).emit('roundSummary', {
      correctUser: state.correctUser?.nickname || null,
      word: state.word,
      gainedScore: state.gainedScore,
      players: state.players,
    });

    state.correctUser = null;
    state.gainedScore = 0;

    if (state.roundTimeout) clearTimeout(state.roundTimeout);
    setTimeout(() => {
      state.round++;
      if (state.round <= state.maxRounds) {
        this.startRound(roomId);
      } else {
        this.endGame(roomId);
      }
    }, 5000);
  }

  handleCorrectAnswer(roomId: string, userId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;
    if (!state.isRoundActive) return;

    const correctPlayer = state.players.find(p => p.userId === userId);
    if (correctPlayer) {
      const score = 100;
      correctPlayer.score += score;

      state.correctUser = correctPlayer;
      state.gainedScore = score;

      state.isRoundActive = false;
      this.endRound(roomId);
    }
  }

  private endGame(roomId: string) {
    const state = this.gameStates.get(roomId);
    if (!state) return;

    state.isGameStarted = false;
    state.isRoundActive = false;
    this.io.to(roomId).emit('gameEnd', {
      players: state.players,
    });

    this.clearGameState(roomId);
  }

  private getRandomWord(): string {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  private createNewGameState(): GameState {
    return {
      players: [],
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
}
