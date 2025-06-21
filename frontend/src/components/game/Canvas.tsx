// src/components/game/Canvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

const COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'];
const CANVAS_MIN_WIDTH = 600;
const CANVAS_MIN_HEIGHT = 400;
const CANVAS_MAX_WIDTH = 900;
const CANVAS_MAX_HEIGHT = 600;

type Mode = 'draw' | 'fill' | 'erase';

interface CanvasProps {
  socket: Socket | null;
  roomId: string;
  currentDrawer: string | null;
}

const Canvas: React.FC<CanvasProps> = ({ socket, roomId, currentDrawer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [color, setColor] = useState(COLORS[0]);
  const [mode, setMode] = useState<Mode>('draw');
  const [lineWidth, setLineWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

  // 반응형 캔버스 크기 조절
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

  // 그리기 시작
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentDrawer !== localStorage.getItem('userId')) return; // 현재 그리는 사람인지 체크
    if (mode === 'fill') {
      handleFill();
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
        mode,
      }
    });
  };

  // 그리기 진행
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
        mode,
      }
    });
  };

  // 그리기 종료
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();

    socket?.emit('draw', {
      roomId,
      data: { type: 'end' }
    });
  };

  // 전체 지우기
  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    socket?.emit('draw', {
      roomId,
      data: { type: 'clear' }
    });
  };

  // 채우기
  const handleFill = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    socket?.emit('draw', {
      roomId,
      data: { type: 'fill', color }
    });
  };

  // 소켓으로 다른 사람의 그리기 명령 처리
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 12,
          margin: '32px 0',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ display: 'block', width: '100%', height: '100%', borderRadius: 12 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {COLORS.map(c => (
          <div
            key={c}
            onClick={() => { setColor(c); setMode('draw'); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: c,
              border: color === c ? '3px solid #333' : '2px solid #fff',
              cursor: 'pointer',
              boxShadow: '0 1px 4px #0002'
            }}
          />
        ))}
        <button
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: mode === 'fill' ? '2px solid #1976d2' : '1px solid #ccc',
            backgroundColor: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer'
          }}
          onClick={() => setMode('fill')}
        >
          채우기
        </button>
        <button
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: mode === 'erase' ? '2px solid #1976d2' : '1px solid #ccc',
            backgroundColor: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer'
          }}
          onClick={() => setMode('erase')}
        >
          일부 지우기
        </button>
        <button
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer'
          }}
          onClick={handleClear}
        >
          전체 지우기
        </button>
      </div>
    </div>
  );
};

export default Canvas;
