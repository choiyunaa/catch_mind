import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';

interface Player {
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
}

interface Message {
  userId: string;
  nickname: string;
  content: string;
  type: 'chat' | 'system';
  timestamp: number;
}

const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(0);
  const [inputMessage, setInputMessage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [lineWidth, setLineWidth] = useState(5);
  const [lineColor, setLineColor] = useState('#000000');

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    contextRef.current = context;
  }, [lineColor, lineWidth]);

  // Socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const newSocket = io('http://localhost:9999', {
      auth: { token },
      query: { roomId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('room:players', (roomPlayers: Player[]) => {
      setPlayers(roomPlayers);
    });

    newSocket.on('game:start', (data: { maxRounds: number }) => {
      setGameStatus('playing');
      setMaxRounds(data.maxRounds);
      setCurrentRound(1);
    });

    newSocket.on('game:round', (data: { 
      drawer: string, 
      word: string,
      timeLeft: number 
    }) => {
      const userId = localStorage.getItem('userId');
      setIsMyTurn(data.drawer === userId);
      setCurrentWord(data.drawer === userId ? data.word : '');
      setTimeLeft(data.timeLeft);
    });

    newSocket.on('game:draw', (data: { x: number, y: number, type: string }) => {
      if (!contextRef.current) return;
      const context = contextRef.current;

      if (data.type === 'start') {
        context.beginPath();
        context.moveTo(data.x, data.y);
      } else if (data.type === 'draw') {
        context.lineTo(data.x, data.y);
        context.stroke();
      }
    });

    newSocket.on('game:message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('game:end', () => {
      setGameStatus('finished');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isMyTurn) return;
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    socket?.emit('game:draw', { x: offsetX, y: offsetY, type: 'start' });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !isMyTurn) return;
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
    socket?.emit('game:draw', { x: offsetX, y: offsetY, type: 'draw' });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Game control functions
  const startGame = () => {
    socket?.emit('game:start');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    socket?.emit('game:message', { content: inputMessage });
    setInputMessage('');
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', padding: 20 }}>
      {/* Left sidebar - Players */}
      <div style={{ width: 200, padding: 16, borderRight: '1px solid #ddd' }}>
        <h3>Players</h3>
        {players.map(player => (
          <div key={player.userId} style={{ marginBottom: 8 }}>
            {player.nickname} {player.isHost && '(Host)'}
            <div>Score: {player.score}</div>
          </div>
        ))}
        {gameStatus === 'waiting' && players.some(p => p.isHost && p.userId === localStorage.getItem('userId')) && (
          <button onClick={startGame} style={{ marginTop: 16, width: '100%' }}>
            Start Game
          </button>
        )}
      </div>

      {/* Main game area */}
      <div style={{ flex: 1, padding: '0 16px' }}>
        <div style={{ marginBottom: 16 }}>
          {gameStatus === 'playing' && (
            <>
              <div>Round: {currentRound} / {maxRounds}</div>
              <div>Time Left: {timeLeft}s</div>
              {isMyTurn && <div>Your word: {currentWord}</div>}
            </>
          )}
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ 
            border: '1px solid #ddd',
            cursor: isDrawingMode && isMyTurn ? 'crosshair' : 'default'
          }}
        />

        {isMyTurn && (
          <div style={{ marginTop: 16 }}>
            <button onClick={() => setIsDrawingMode(!isDrawingMode)}>
              {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
            </button>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            />
            <button onClick={clearCanvas} style={{ marginLeft: 8 }}>
              Clear Canvas
            </button>
          </div>
        )}
      </div>

      {/* Right sidebar - Chat */}
      <div style={{ width: 300, padding: 16, borderLeft: '1px solid #ddd' }}>
        <h3>Chat</h3>
        <div style={{ 
          height: 'calc(100vh - 200px)', 
          overflowY: 'auto',
          marginBottom: 16,
          padding: 8,
          border: '1px solid #ddd'
        }}>
          {messages.map((message, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <span style={{ 
                color: message.type === 'system' ? '#666' : '#000',
                fontWeight: message.type === 'system' ? 'normal' : 'bold'
              }}>
                {message.nickname}:
              </span>
              <span style={{ marginLeft: 8 }}>{message.content}</span>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ width: '100%', padding: 8 }}
          />
        </form>
      </div>
    </div>
  );
};

export default GameRoom; 