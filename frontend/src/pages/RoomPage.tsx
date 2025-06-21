import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import Canvas from '../components/game/Canvas';
import PlayerList from '../components/game/PlayerList';

// ✅ Player 타입 직접 정의
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
  const [gameStatus, setGameStatus] = useState<'waiting' | 'countdown' | 'playing' | 'finished'>('waiting');
  const [inputMessage, setInputMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [currentDrawer, setCurrentDrawer] = useState<string | null>(null);

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
      newSocket.emit('room:join', { roomId, userId, nickname });
    });

    newSocket.on('connect_error', () => {
      socketConnected.current = false;
      setSocket(null);
    });

    newSocket.on('room:players', (players: Player[]) => {
      setPlayers(players);
    });

    newSocket.on('game:countdown', () => {
      setGameStatus('countdown');
      setCountdown(3);
    });

    newSocket.on('gameStarted', (data) => {
      setGameStatus('playing');
      setTimeLeft(Math.floor((new Date(data.endTime).getTime() - Date.now()) / 1000));
      setCurrentRound(data.round);
      setMaxRounds(data.maxRounds);
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
      }, 3000);
    });

    return () => {
      newSocket.disconnect();
      socketConnected.current = false;
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (gameStatus !== 'playing' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, timeLeft]);

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
    socket.emit('chat', { roomId, userId, message: inputMessage });
    setInputMessage('');
  };

  const startGame = () => {
    socket?.emit('startGame', { roomId });
  };

  const handleLeaveRoom = () => {
    if (socket) {
      const userId = localStorage.getItem('userId');
      socket.emit('leaveRoom', { roomId, userId });
      socket.disconnect();
    }
    navigate('/');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', minHeight: 600, background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 버튼 */}
      <div style={{ position: 'absolute', top: 24, right: 36, zIndex: 10, display: 'flex', gap: 12 }}>
        <button onClick={startGame} style={{ padding: '10px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8 }}>게임 시작</button>
        <button onClick={handleLeaveRoom} style={{ padding: '10px 24px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 8 }}>나가기</button>
      </div>

      {/* 상단 정보바 */}
      <div style={{ width: '100%', maxWidth: 1400, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginRight: 300 }}>
        <div style={{ flex: 1 }} />
        <div style={{ width: 320, height: 60, background: '#eee', borderRadius: '12px 0 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 22 }}>
          방 코드: {roomId}
        </div>
        <div style={{ width: 320, height: 60, background: '#eee', borderRadius: '0 12px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 22 }}>
          {gameStatus === 'playing' ? (
            <>제시어: {currentDrawer === localStorage.getItem('userId') ? currentWord : '???'}</>
          ) : gameStatus === 'countdown' ? (
            <>게임 시작까지 {countdown}초</>
          ) : <>대기 중...</>}
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* 캔버스 + 플레이어 목록 */}
      <div style={{ width: '100%', maxWidth: 1400, flex: 1, display: 'flex', position: 'relative', margin: '0 auto' }}>
        <div style={{ flex: 1, marginRight: 300 }}>
          <Canvas socket={socket} currentDrawer={currentDrawer} roomId={roomId || ''} />
        </div>
        <PlayerList players={players} />
      </div>
    </div>
  );
};

export default RoomPage;
