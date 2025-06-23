import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

import Canvas from '../components/game/Canvas';
import PlayerList from '../components/game/PlayerList';
import RoundSummaryModal from '../components/game/RoundSummaryModal';
import FinalResultModal from '../components/game/FinalResultModal';
import JoinFailedModal from '../components/game/JoinFailedModal';

interface Player {
  clientId: string;
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
  lastMessage?: string;
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameStatus, setGameStatus] = useState<
    'waiting' | 'countdown' | 'playing' | 'summary' | 'finished'
  >('waiting');
  const [inputMessage, setInputMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [currentDrawer, setCurrentDrawer] = useState<string | null>(null);
  const [roundSummary, setRoundSummary] = useState<{
    correctUser: string | null;
    word: string;
    gainedScore: number;
    players: Player[];
  } | null>(null);
  const [finalResultVisible, setFinalResultVisible] = useState(false);

  // 입장 실패 관련 상태
  const [joinFailed, setJoinFailed] = useState(false);
  const [joinFailedReason, setJoinFailedReason] = useState('');

  const canvasRef = useRef<any>(null);
  const socketConnected = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const nickname = localStorage.getItem('nickname') || 'user';

    if (!token || !userId) {
      navigate('/');
      return;
    }

    if (socketConnected.current) return;

    const newSocket = io('http://localhost:9999/game', {
      transports: ['websocket'],
      auth: { token },
    });

    setSocket(newSocket);
    socketConnected.current = true;

    newSocket.on('connect', () => {
      console.log('소켓 연결됨:', newSocket.id);
      newSocket.emit('room:join', { roomId, userId, nickname });
    });

    newSocket.on('connect_error', (err) => {
      console.error('소켓 연결 오류:', err);
      socketConnected.current = false;
      setSocket(null);
    });

    newSocket.on('room:joinFailed', ({ reason }) => {
      setJoinFailedReason(reason);
      setJoinFailed(true);
    });

    newSocket.on('room:players', (players: Player[]) => {
      setPlayers(players);
    });

    // 새로 추가: 방 전체 상태 업데이트 이벤트
    newSocket.on('room:update', (roomData) => {
      setPlayers(roomData.players || []);
      setCurrentRound(roomData.currentRound || 0);
      setMaxRounds(roomData.maxRounds || 3);
      setCurrentDrawer(roomData.currentDrawer || null);
      // gameStatus가 summary 또는 finished일 때는 상태를 덮어쓰지 않음
      if (roomData.status && gameStatus !== 'summary' && gameStatus !== 'finished') {
        setGameStatus(roomData.status);
      }
      setCurrentWord(roomData.currentWord || '');
    });

    newSocket.on('game:countdown', () => {
      setGameStatus('countdown');
      setCountdown(3);
    });

    newSocket.on('gameStarted', (data) => {
      setGameStatus('playing');
      const end = new Date(data.endTime).getTime();
      const now = Date.now();
      const duration = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(duration);
      setCurrentRound(data.round);
      setMaxRounds(data.maxRounds || 3);
      setCurrentDrawer(data.drawer.userId);
    });

    newSocket.on('word', (data) => {
      if (data.userId === localStorage.getItem('userId')) {
        setCurrentWord(data.word);
      } else {
        setCurrentWord('');
      }
    });

    newSocket.on('gameEnd', ({ players }) => {
      setGameStatus('finished');
      setPlayers(players);
      setFinalResultVisible(true);
      canvasRef.current?.clearCanvas();
    });

    newSocket.on('roundSummary', (data) => {
      setGameStatus('summary');
      setRoundSummary({
        correctUser: data.correctUser,
        word: data.word,
        gainedScore: data.gainedScore,
        players: data.players,
      });
      canvasRef.current?.clearCanvas();
      setPlayers(data.players);

      setTimeout(() => {
        setRoundSummary(null);
        if (currentRound < maxRounds) {
          setGameStatus('playing');
        } else {
          setGameStatus('finished');
          setFinalResultVisible(true);
        }
      }, 3000);
    });

    newSocket.on('chat', ({ userId: senderId, message }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === senderId ? { ...p, lastMessage: message } : p
        )
      );
      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.userId === senderId ? { ...p, lastMessage: undefined } : p
          )
        );
      }, 4000);
    });

    return () => {
      newSocket.disconnect();
      socketConnected.current = false;
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'countdown' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, countdown]);

  const handleInput = (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputMessage.trim() || !socket) return;
  const userId = localStorage.getItem('userId');
  const trimmedMessage = inputMessage.trim();

  // 채팅 보내기
  socket.emit('chat', { roomId, userId, message: trimmedMessage });

  // ✅ 정답 확인 후 서버에 알림 보내기
  if (
    trimmedMessage === currentWord && // 정답인지 확인
    userId !== currentDrawer // 출제자 자신은 정답 맞추기 금지
  ) {
    socket.emit('correctAnswer', { roomId, userId });
  }

  setInputMessage('');
};

  const startGame = () => {
    if (!socket) {
      console.warn('startGame 호출 시 소켓이 연결되어 있지 않습니다.');
      return;
    }
    console.log('startGame 이벤트 전송:', { roomId, round: 1 });
    socket.emit('startGame', { roomId, round: 1 });
    setFinalResultVisible(false);
  };

  const handleLeaveRoom = () => {
    if (socket) {
      const userId = localStorage.getItem('userId');
      socket.emit('leaveRoom', { roomId, userId });
      socket.disconnect();
    }
    navigate('/');
  };

  if (joinFailed) {
    return (
      <JoinFailedModal
        reason={joinFailedReason}
        onConfirm={() => {
          setJoinFailed(false);
          navigate('/');
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: 600,
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* 현재 라운드 크게 표시 */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          marginTop: 24,
          color: '#1976d2',
          userSelect: 'none',
        }}
      >
        {currentRound > 0 ? `ROUND ${currentRound}` : ''}
      </div>

      <RoundSummaryModal
        isVisible={!!roundSummary}
        onClose={() => {
          setRoundSummary(null);
          setGameStatus('playing');
        }}
        round={currentRound}
        word={roundSummary?.word || ''}
        correctUser={roundSummary?.correctUser || null}
        gainedScore={roundSummary?.gainedScore || 0}
        players={roundSummary?.players || []}
      />

      <FinalResultModal
        isVisible={finalResultVisible}
        players={players}
        onRetry={() => {
          if (socket) socket.emit('room:reset', { roomId });
          setGameStatus('waiting');
          setCurrentRound(0);
          setCurrentDrawer(null);
          setCurrentWord('');
          setTimeLeft(120);
          setRoundSummary(null);
          canvasRef.current?.clearCanvas();
          setFinalResultVisible(false);
        }}
        onLeave={handleLeaveRoom}
      />

      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 36,
          zIndex: 10,
          display: 'flex',
          gap: 12,
        }}
      >
        {Array.isArray(players) &&
          players.find(
            (p) => p.userId === localStorage.getItem('userId') && p.isHost
          ) && (
            <button
              onClick={startGame}
              disabled={gameStatus === 'playing'}
              style={{
                padding: '10px 24px',
                background: gameStatus === 'playing' ? '#9e9e9e' : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: gameStatus === 'playing' ? 'not-allowed' : 'pointer',
                opacity: gameStatus === 'playing' ? 0.6 : 1,
              }}
            >
              게임 시작
            </button>
          )}
        <button
          onClick={handleLeaveRoom}
          style={{
            padding: '10px 24px',
            background: '#e53935',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
          }}
        >
          나가기
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 1400,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 32,
          marginRight: 300,
        }}
      >
        <div style={{ flex: 1 }} />

        <div
          style={{
            width: 320,
            height: 60,
            background: '#eee',
            borderRadius: '12px 0 0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 22,
          }}
        >
          방 코드: {roomId}
        </div>

        <div
          style={{
            width: 320,
            height: 60,
            background: '#eee',
            borderRadius: '0 12px 12px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 22,
          }}
        >
          {gameStatus === 'playing' ? (
            <>
              제시어:{' '}
              {currentDrawer === localStorage.getItem('userId') ? currentWord : '???'} / ⏱ {timeLeft}s
            </>
          ) : gameStatus === 'countdown' ? (
            <>게임 시작까지 {countdown}초</>
          ) : gameStatus === 'summary' && roundSummary ? (
            <>
              정답: {roundSummary.word}{' '}
              {roundSummary.correctUser ? `${roundSummary.correctUser} +${roundSummary.gainedScore}` : ''}
            </>
          ) : (
            <>대기 중...</>
          )}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 1400,
          flex: 1,
          display: 'flex',
          position: 'relative',
          margin: '0 auto',
        }}
      >
        <div style={{ flex: 1, marginRight: 300 }}>
          <Canvas socket={socket} currentDrawer={currentDrawer} roomId={roomId || ''} ref={canvasRef} />
        </div>
        <PlayerList players={players} currentDrawer={currentDrawer} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 1400,
          display: 'flex',
          marginBottom: 100,
        }}
      >
        <form
          onSubmit={handleInput}
          style={{
            flex: 1,
            display: 'flex',
            marginRight: 300,
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
        >
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="채팅을 입력하세요..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              fontSize: 16,
              marginRight: 8,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomPage;
