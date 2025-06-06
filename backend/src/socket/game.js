const Room = require('../models/Room');
const words = ['사과', '바나나', '자동차', '비행기', '고양이', '강아지', '책상', '의자', '컴퓨터', '휴대폰']; // 예시 단어들

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 방 입장
    socket.on('joinRoom', async ({ roomId, userId, nickname }) => {
      if (!userId) {
        console.log('userId is null, joinRoom ignored');
        return;
      }
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);

      // DB에서 방을 찾고, 이미 없으면 추가
      const room = await Room.findById(roomId);
      if (!room) return;

      // 이미 있는 유저인지 확인
      const exists = room.players.some(p => p.userId.toString() === userId);
      if (!exists) {
        room.players.push({
          userId,
          nickname,
          isHost: room.players.length === 0, // 첫 입장자는 방장
          score: 0
        });
        await room.save();
      }

      // 모든 유저에게 현재 플레이어 목록 전송
      io.to(roomId).emit('room:players', room.players);
    });

    // 채팅(정답) 입력 브로드캐스트
    socket.on('chat', ({ roomId, userId, message }) => {
      io.to(roomId).emit('chat', { userId, message });
    });

    // 공통 방 퇴장/삭제 함수
    async function handleLeaveRoom(roomId, userId, io) {
      const room = await Room.findById(roomId);
      if (!room) return;
      console.log('handleLeaveRoom', roomId, userId);
      console.log('Room.players before:', room.players.map(p => p.userId && p.userId.toString()));
      room.players = room.players.filter(p => p.userId && p.userId.toString() !== userId);
      console.log('Room.players after:', room.players.map(p => p.userId && p.userId.toString()));
      if (room.players.length === 0) {
        await Room.deleteOne({ _id: roomId });
        console.log(`Room ${roomId} deleted (no players left)`);
        return;
      }
      await room.save();
      io.to(roomId).emit('room:players', room.players);
    }

    // leaveRoom
    socket.on('leaveRoom', async ({ roomId, userId }) => {
      socket.leave(roomId);
      console.log(`User ${userId} left room ${roomId}`);
      await handleLeaveRoom(roomId, userId, io);
    });

    // 그림 그리기 데이터 전송
    socket.on('draw', ({ roomId, data }) => {
      socket.to(roomId).emit('draw', data);
    });

    // 정답 제출
    socket.on('submitAnswer', async ({ roomId, userId, answer }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'playing') return;

        const player = room.players.find(p => p.userId.toString() === userId);
        if (!player || player.userId.toString() === room.currentDrawer.toString()) return;

        if (answer === room.currentWord) {
          // 정답 맞춘 경우 점수 계산
          const timeLeft = Math.max(0, (room.endTime - new Date()) / 1000);
          const score = Math.floor(timeLeft * 10);
          player.score += score;

          // 모든 플레이어에게 정답 알림
          io.to(roomId).emit('correctAnswer', {
            userId,
            nickname: player.nickname,
            score
          });

          await room.save();
        }
      } catch (err) {
        console.error('Error in submitAnswer:', err);
      }
    });

    // 게임 시작
    socket.on('startGame', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        // 방장인지 확인
        const userId = socket.handshake.auth.userId;
        if (!userId) {
          console.log('userId is missing');
          return;
        }

        const isHost = room.players.find(p => p.userId.toString() === userId)?.isHost;
        if (!isHost) {
          console.log('Only host can start the game');
          return;
        }

        if (room.status !== 'waiting') {
          console.log('Game is already in progress');
          return;
        }

        // 카운트다운 시작
        io.to(roomId).emit('game:countdown');

        // 3초 후 게임 시작
        setTimeout(async () => {
          try {
            room.status = 'playing';
            room.currentRound = 1;
            room.startTime = new Date();
            
            // 첫 번째 그리는 사람 선택
            const firstDrawer = room.players[Math.floor(Math.random() * room.players.length)];
            room.currentDrawer = firstDrawer.userId;
            
            // 첫 번째 제시어 선택
            room.currentWord = words[Math.floor(Math.random() * words.length)];
            
            // 게임 시작 시간 설정
            room.endTime = new Date(Date.now() + 120 * 1000); // 120초(2분)

            await room.save();

            // 모든 플레이어에게 게임 시작 알림
            io.to(roomId).emit('gameStarted', {
              drawer: firstDrawer,
              endTime: room.endTime.toISOString(),
              round: room.currentRound,
              maxRounds: room.maxRounds
            });

            // word emit 직전 로그 추가
            console.log('[emit word] to room:', roomId, 'drawerUserId:', firstDrawer.userId, 'word:', room.currentWord);
            // 그리는 사람에게만 제시어 전송 (임시: 방 전체에 보내고 프론트에서 userId로 구분)
            io.to(roomId).emit('word', {
              userId: firstDrawer.userId,
              word: room.currentWord
            });
          } catch (err) {
            console.error('[setTimeout 내부 에러]', err);
          }
        }, 3000);
      } catch (err) {
        console.error('Error in startGame:', err);
      }
    });

    // 라운드 종료
    socket.on('roundEnd', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'playing') return;

        // 다음 라운드로 진행
        room.currentRound++;
        
        if (room.currentRound > room.maxRounds) {
          // 게임 종료
          room.status = 'finished';
          io.to(roomId).emit('gameEnd', {
            players: room.players.sort((a, b) => b.score - a.score)
          });
        } else {
          // 다음 그리는 사람 선택
          const currentDrawerIndex = room.players.findIndex(p => p.userId.toString() === room.currentDrawer.toString());
          const nextDrawerIndex = (currentDrawerIndex + 1) % room.players.length;
          room.currentDrawer = room.players[nextDrawerIndex].userId;
          
          // 새로운 제시어 선택
          room.currentWord = words[Math.floor(Math.random() * words.length)];
          
          // 새로운 라운드 시작 시간 설정
          room.startTime = new Date();
          room.endTime = new Date(Date.now() + 120 * 1000); // 120초(2분)

          await room.save();

          // 모든 플레이어에게 새 라운드 시작 알림
          io.to(roomId).emit('newRound', {
            round: room.currentRound,
            drawer: room.players[nextDrawerIndex],
            endTime: room.endTime
          });

          // 그리는 사람에게만 제시어 전송
          io.to(roomId).emit('word', {
            userId: room.players[nextDrawerIndex].userId,
            word: room.currentWord
          });
        }
      } catch (err) {
        console.error('Error in roundEnd:', err);
      }
    });

    // disconnect
    socket.on('disconnect', async () => {
      // socket.rooms는 Set, 첫 번째는 socket.id, 두 번째부터가 실제 방
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          // userId를 socket.handshake.auth에서 가져옴
          const userId = socket.handshake.auth.userId;
          if (userId) {
            await handleLeaveRoom(roomId, userId, io);
          }
        }
      }
    });
  });
}; 