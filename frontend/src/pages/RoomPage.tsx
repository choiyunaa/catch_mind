import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

const COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'];
const CANVAS_MIN_WIDTH = 600;
const CANVAS_MIN_HEIGHT = 400;
const CANVAS_MAX_WIDTH = 900;
const CANVAS_MAX_HEIGHT = 600;

type Mode = 'draw' | 'fill' | 'erase';

interface Player {
  userId: string;
  nickname: string;
  isHost: boolean; // 이 필드가 중요합니다.
  score: number;
  isCorrect?: boolean;
  lastMessage?: string;
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'countdown' | 'playing' | 'finished'>('waiting');
  const [inputMessage, setInputMessage] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [mode, setMode] = useState<Mode>('draw');
  const [lineWidth, setLineWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [currentDrawer, setCurrentDrawer] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // players-update 이벤트 핸들러 (기존과 동일)
  useEffect(() => {
    if (!socket) return;

    const handler = (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    };

    socket.on('players-update', handler);

    return () => {
      socket.off('players-update', handler);
    };
  }, [socket]);
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const newSocket = io('http://localhost:9999', {
    auth: {
      token,
      userId: localStorage.getItem('userId'),
      roomId,
    },
  });

  setSocket(newSocket);

  // 이벤트 리스너 등록
  newSocket.on('roomPlayers', (players) => {
    console.log('현재 방 플레이어들:', players);
    setPlayers(players); // players 상태를 업데이트하는 함수 예시
  });

  newSocket.on('roomMessage', (msg) => {
    console.log('방 메시지:', msg);
    setMessages((prev) => [...prev, msg]); // 메시지 상태 업데이트 예시
  });

  // 컴포넌트 언마운트 시 소켓 연결 해제
  return () => {
    newSocket.disconnect();
  };
}, [roomId]);

const [messages, setMessages] = useState<string[]>([]);

  // 소켓 연결 및 이벤트 등록 (기존과 동일)
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const userId = localStorage.getItem('userId');
  const nickname = localStorage.getItem('nickname') || 'user';

  const newSocket = io('http://localhost:9999', {
    auth: { token, userId, roomId },
  });

  setSocket(newSocket);

  newSocket.emit('joinRoom', { roomId, userId, nickname });

  newSocket.on('roomPlayers', (players: Player[]) => {
    setPlayers(players);
  });

  newSocket.on('roomMessage', (msg) => {
    setMessages(prev => [...prev, msg]);
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
    if (data.userId === userId) {
      setCurrentWord(data.word);
    } else {
      setCurrentWord('');
    }
  });

  newSocket.on('newRound', (data) => {
    setTimeLeft(Math.floor((new Date(data.endTime).getTime() - Date.now()) / 1000));
    setCurrentRound(data.round);
    setCurrentDrawer(data.drawer.userId);
  });

  newSocket.on('gameEnd', ({ players }) => {
    setGameStatus('finished');
    setPlayers(players);
  });

  newSocket.on('chat', ({ userId: senderId, message }) => {
    setPlayers(prev => prev.map(p => p.userId === senderId ? { ...p, lastMessage: message } : p));
    setTimeout(() => {
      setPlayers(prev => prev.map(p => p.userId === senderId ? { ...p, lastMessage: undefined } : p));
    }, 3000);
  });

  return () => {
    newSocket.disconnect();
  };
}, [roomId]);


  // 타이머 감소 (기존과 동일)
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, timeLeft]);

  // 카운트다운 처리 (기존과 동일)
  useEffect(() => {
    if (gameStatus !== 'countdown') return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, countdown]);

  // 캔버스 관련 함수 (그리기/지우기/채우기) - 기존과 동일
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentDrawer !== localStorage.getItem('userId')) return;
    if (mode === 'fill') {
      handleFill(e);
      return;
    }
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    socket?.emit('draw', {
      roomId,
      data: {
        type: 'begin',
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
        color,
        lineWidth,
        mode
      }
    });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (currentDrawer !== localStorage.getItem('userId')) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = mode === 'erase' ? '#fff' : color;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    socket?.emit('draw', {
      roomId,
      data: {
        type: 'draw',
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
        color,
        lineWidth,
        mode
      }
    });
  };
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    socket?.emit('draw', {
      roomId,
      data: { type: 'end' }
    });
  };
  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket?.emit('draw', {
      roomId,
      data: { type: 'clear' }
    });
  };
  const handleFill = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
    socket?.emit('draw', {
      roomId,
      data: { type: 'fill', color }
    });
  };

  // 소켓 draw 이벤트 수신: 다른 플레이어의 그리기 반영 (기존과 동일)
  useEffect(() => {
    if (!socket) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const handleDraw = (data: any) => {
      if (!canvasRef.current) return;
      switch (data.type) {
        case 'begin':
          ctx.beginPath();
          ctx.moveTo(data.x, data.y);
          ctx.strokeStyle = data.mode === 'erase' ? '#fff' : data.color;
          ctx.lineWidth = data.lineWidth;
          break;
        case 'draw':
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineTo(data.x, data.y);
          ctx.strokeStyle = data.mode === 'erase' ? '#fff' : data.color;
          ctx.lineWidth = data.lineWidth;
          ctx.stroke();
          break;
        case 'end':
          ctx.closePath();
          break;
        case 'clear':
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          break;
        case 'fill':
          ctx.fillStyle = data.color;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          break;
        default:
          break;
      }
    };
    socket.on('draw', handleDraw);
    return () => {
      socket.off('draw', handleDraw);
    };
  }, [socket]);

  // 정답 입력 (기존과 동일)
  const handleInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;
    const userId = localStorage.getItem('userId');
    socket.emit('chat', { roomId, userId, message: inputMessage });
    setInputMessage('');
  };

  // 게임 시작 (기존과 동일)
  const startGame = () => {
    const userId = localStorage.getItem('userId');
    socket?.emit('startGame', { roomId, userId });
  };

  // 반응형 캔버스 크기 계산 (기존과 동일)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  useEffect(() => {
    const handleResize = () => {
      const w = Math.max(CANVAS_MIN_WIDTH, Math.min(window.innerWidth * 0.6, CANVAS_MAX_WIDTH));
      const h = Math.max(CANVAS_MIN_HEIGHT, Math.min(window.innerHeight * 0.6, CANVAS_MAX_HEIGHT));
      setCanvasSize({ width: w, height: h });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 방 나가기 (기존과 동일)
  const handleLeaveRoom = () => {
    if (socket) {
      const userId = localStorage.getItem('userId');
      socket.emit('leaveRoom', { roomId, userId });
      socket.disconnect();
    }
    navigate('/');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', minHeight: 600, background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
      {/* 우측 상단 나가기/시작 버튼 */}
      <div style={{ position: 'absolute', top: 24, right: 36, zIndex: 10, display: 'flex', gap: 12 }}>
        {/* 호스트에게만 시작 버튼 표시 */}
        {(() => {
          const myId = localStorage.getItem('userId');
          const me = players.find(p => p.userId === myId);
if (me && me.isHost && gameStatus === 'waiting') {
            return (
              <button
                onClick={startGame}
                style={{
                  padding: '10px 24px',
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #1976d222',
                  marginRight: 8
                }}
              >
                게임 시작
              </button>
            );
          }
          return null;
        })()}
        <button
          onClick={handleLeaveRoom}
          style={{ padding: '10px 24px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}
        >
          나가기
        </button>
      </div>

      {/* 상단 정보바 */}
      <div style={{ width: '100%', maxWidth: 1400, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '32px 0 0 0', gap: 0 }}>
        <div style={{ flex: 1 }} />
        <div style={{ width: 320, height: 60, background: '#eee', borderRadius: '12px 0 0 12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontWeight: 'bold', fontSize: 22, borderRight: '1px solid #ddd' }}>방 코드: {roomId}</div>
        <div style={{ width: 320, height: 60, background: '#eee', borderRadius: '0 12px 12px 0', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontWeight: 'bold', fontSize: 22 }}>
          {gameStatus === 'playing' ? (
  <>제시어: {currentDrawer === localStorage.getItem('userId') && currentWord ? currentWord : '???'}</>
) : gameStatus === 'countdown' ? (
  <>게임 시작까지 {countdown}초</>
) : (
  <>대기 중...</>
          )}
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* 라운드 표시 */}
      {gameStatus === 'playing' && (
        <div style={{
          position: 'absolute',
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1976d2',
          color: '#fff',
          padding: '8px 24px',
          borderRadius: 20,
          fontWeight: 'bold',
          fontSize: 18,
          boxShadow: '0 2px 8px #1976d222'
        }}>
          라운드 {currentRound} / {maxRounds}
        </div>
      )}

      {/* 카운트다운 오버레이 */}
      {gameStatus === 'countdown' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: '#fff',
            animation: 'scale 1s infinite'
          }}>
            {countdown}
          </div>
        </div>
      )}

      {/* 메인 영역: 캔버스 + 플레이어 목록 */}
      <div style={{ width: '100%', maxWidth: 1400, flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', margin: '0 auto', gap: 0 }}>
        {/* 중앙: 캔버스 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ width: canvasSize.width, height: canvasSize.height, background: '#fff', border: '1px solid #ddd', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '32px 0' }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ display: 'block', background: 'transparent', borderRadius: 12, zIndex: 1, width: '100%', height: '100%' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
          {/* 하단 컨트롤 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', margin: '0 0 32px 0' }}>
            {/* 색상 선택 */}
            <div style={{ display: 'flex', gap: 12 }}>
              {COLORS.map((c, i) => (
                <div
                  key={c}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: color === c ? '3px solid #333' : '2px solid #fff', cursor: 'pointer', boxShadow: '0 1px 4px #0002' }}
                  onClick={() => { setColor(c); setMode('draw'); }}
                />
              ))}
            </div>
            {/* 채우기 */}
            <button style={{ padding: '8px 18px', borderRadius: 8, border: mode === 'fill' ? '2px solid #1976d2' : '1px solid #ccc', background: '#fff', fontWeight: 'bold', fontSize: 16 }} onClick={() => setMode('fill')}>채우기</button>
            {/* 부분 지우기 */}
            <button style={{ padding: '8px 18px', borderRadius: 8, border: mode === 'erase' ? '2px solid #1976d2' : '1px solid #ccc', background: '#fff', fontWeight: 'bold', fontSize: 16 }} onClick={() => setMode('erase')}>일부 지우기</button>
            {/* 전체 지우기 */}
            <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', fontWeight: 'bold', fontSize: 16 }} onClick={handleClear}>전체 지우기</button>
            {/* 타이머 */}
            <div style={{ width: 100, background: '#eee', borderRadius: 8, padding: '10px 0', textAlign: 'center', fontWeight: 'bold', fontSize: 22 }}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            {/* 정답 입력 */}
            <form onSubmit={handleInput} style={{ flex: 1 }}>
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="정답을 입력하세요."
                style={{ width: 220, padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, background: '#f5f5f5' }}
              />
            </form>
          </div>
        </div>
        {/* 우측: 플레이어 목록 */}
        <div style={{
          position: 'absolute',
          top: 100,
          right: 0,
          width: 260,
          height: 'calc(100% - 120px)',
          background: '#fff',
          borderLeft: '1px solid #eee',
          boxShadow: '-2px 0 8px #0001',
          borderRadius: '24px 0 0 24px',
          padding: '32px 0 0 0',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>플레이어 목록</h3>
  {players.length === 0 && <div>아직 플레이어가 없습니다.</div>}
  {players.map(player => (
    <div key={player.userId} style={{
      padding: '6px 8px',
      marginBottom: 6,
      backgroundColor: player.userId === localStorage.getItem('userId') ? '#e3f2fd' : '#fafafa',
      borderRadius: 6,
      fontWeight: player.isHost ? 'bold' : 'normal',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: player.isHost ? '1px solid #1976d2' : '1px solid transparent',
    }}>
      <span>{player.nickname}{player.isHost ? ' (호스트)' : ''}</span>
      <span style={{ fontSize: 12, color: '#666' }}>점수: {player.score}</span>
    </div>
  ))}
</div>
      </div>
    </div>
  );
};

export default RoomPage;