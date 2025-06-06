export class Game {
  private roomId: string;
  private players: Player[] = [];
  private drawer: Player | null = null;
  private word: string = '';
  private endTime: Date | null = null;
  private io: Server;
  private round: number = 0;
  private maxRounds: number = 3;
  private isGameStarted: boolean = false;

  constructor(roomId: string, io: Server) {
    this.roomId = roomId;
    this.io = io;
  }

  startGame() {
    if (this.isGameStarted) return;
    this.isGameStarted = true;
    this.round = 1;
    
    // 카운트다운 시작
    this.io.to(this.roomId).emit('game:countdown');
    
    // 3초 후 게임 시작
    setTimeout(() => {
      this.startRound();
    }, 3000);
  }

  private startRound() {
    if (this.round > this.maxRounds) {
      this.endGame();
      return;
    }

    // 그리는 사람 선택
    const drawerIndex = (this.round - 1) % this.players.length;
    this.drawer = this.players[drawerIndex];

    // 제시어 선택
    this.word = this.getRandomWord();

    // 종료 시간 설정 (2분)
    this.endTime = new Date(Date.now() + 120000);

    // 게임 시작 이벤트 발생
    this.io.to(this.roomId).emit('gameStarted', {
      drawer: this.drawer,
      endTime: this.endTime.toISOString(),
      round: this.round,
      maxRounds: this.maxRounds
    });

    // 그리는 사람에게만 제시어 전달
    this.io.to(this.drawer.userId).emit('word', {
      userId: this.drawer.userId,
      word: this.word
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
      players: this.players
    });
  }
} 