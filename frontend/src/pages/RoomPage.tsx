// src/pages/RoomPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Canvas from '../components/game/Canvas';
import PlayerList from '../components/game/PlayerList';
import RoundSummaryModal from '../components/game/RoundSummaryModal';
import FinalResultModal from '../components/game/FinalResultModal';
import JoinFailedModal from '../components/game/JoinFailedModal';
import LookDrawGalleryModal from '../components/game/LookDrawGalleryModal';

import socket from '../socket';  // 전역 socket 인스턴스 import

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

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'countdown' | 'playing' | 'summary' | 'finished'>('waiting');
  const [inputMessage, setInputMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [currentDrawer, setCurrentDrawer] = useState<string | null>(null);
  const [roundSummary, setRoundSummary] = useState<{
    round: number;
    correctUser: string | null;
    word: string;
    gainedScore: number;
    players: Player[];
    isLastRound?: boolean;
  } | null>(null);
  const [finalResultVisible, setFinalResultVisible] = useState(false);
  const [joinFailed, setJoinFailed] = useState(false);
  const [joinFailedReason, setJoinFailedReason] = useState('');
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);
  const [lookDrawVisible, setLookDrawVisible] = useState(false);

  const canvasRef = useRef<any>(null);

  const uploadImageToServer = async (base64Image: string): Promise<string | null> => {
    if (!roomId) {
      console.error('uploadImageToServer: roomId is undefined');
      return null;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');

      let blob: Blob;
      try {
        const base64Data = base64Image.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      } catch (e) {
        console.error('Base64 to Blob conversion error:', e);
        return null;
      }

      const formData = new FormData();
      formData.append('file', blob, `drawing_${Date.now()}.png`);

      const response = await fetch(`http://localhost:9999/api/lookdraw/upload/${roomId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.url || null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const nickname = localStorage.getItem('nickname') || 'user';

    if (!token || !userId) {
      navigate('/');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('room:join', { roomId, userId, nickname });

    socket.on('connect_error', () => {
      setJoinFailedReason('Socket connection error');
      setJoinFailed(true);
    });

    socket.on('room:joinFailed', ({ reason }) => {
      setJoinFailedReason(reason);
      setJoinFailed(true);
    });

    socket.on('room:players', setPlayers);

    socket.on('room:update', (roomData) => {
      setPlayers(roomData.players || []);
      setCurrentRound(roomData.currentRound || 0);
      setMaxRounds(roomData.maxRounds || 3);
      setCurrentDrawer(roomData.currentDrawer || null);
      if (roomData.status && gameStatus !== 'summary' && gameStatus !== 'finished') {
        setGameStatus(roomData.status);
      }
    });

    socket.on('game:countdown', () => {
      setGameStatus('countdown');
      setCountdown(3);
    });

    socket.on('gameStarted', (data) => {
      setGameStatus('playing');
      const end = new Date(data.endTime).getTime();
      const now = Date.now();
      const duration = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(duration);
      setCurrentRound(data.round);
      setMaxRounds(data.maxRounds || 3);
      setCurrentDrawer(data.drawer.userId);
    });

    socket.on('word', (data) => {
      if (data.userId === localStorage.getItem('userId')) {
        setCurrentWord(data.word);
      } else {
        setCurrentWord('');
      }
    });

    socket.on('gameEnd', ({ players }) => {
      setGameStatus('finished');
      setPlayers(players);
      setFinalResultVisible(true);
      canvasRef.current?.clearCanvas();
    });

    socket.on('roundSummary', async (data) => {
  setGameStatus('summary');
  setRoundSummary({
    round: data.round,
    correctUser: data.correctUser,
    word: data.word,
    gainedScore: data.gainedScore,
    players: data.players,
    isLastRound: data.isLastRound,
  });

  // ✅ 먼저 그림 저장!
  if (canvasRef.current) {
    const base64Image = canvasRef.current.getCanvasImage();
    const imageUrl = await uploadImageToServer(base64Image);
    if (imageUrl) {
      setSavedDrawings((prev) => [...prev, imageUrl]);
    }
  }

  // ✅ 그 다음에 캔버스를 지운다
  canvasRef.current?.clearCanvas();

  setPlayers(data.players);
  setCurrentWord('');
});

    socket.on('chat', ({ userId: senderId, message }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.userId === senderId ? { ...p, lastMessage: message } : p))
      );
      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((p) => (p.userId === senderId ? { ...p, lastMessage: undefined } : p))
        );
      }, 4000);
    });

    return () => {
      socket.off('connect_error');
      socket.off('room:joinFailed');
      socket.off('room:players');
      socket.off('room:update');
      socket.off('game:countdown');
      socket.off('gameStarted');
      socket.off('word');
      socket.off('gameEnd');
      socket.off('roundSummary');
      socket.off('chat');
    };
  }, [roomId, navigate, gameStatus]);

  // 게임 시간 타이머
  useEffect(() => {
    if (gameStatus !== 'playing' || roundSummary) return;
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
  }, [gameStatus, roundSummary]);

  // 카운트다운 타이머
  useEffect(() => {
    if (gameStatus !== 'countdown' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, countdown]);

  // 라운드 요약 후 다음 라운드 시작 혹은 게임 종료 처리
  useEffect(() => {
    if (!roundSummary) return;
    const timer = setTimeout(() => {
      setRoundSummary(null);
      if (!roundSummary.isLastRound) {
        socket.emit('startNextRound', { roomId });
      } else {
        setGameStatus('finished');
        setFinalResultVisible(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [roundSummary, roomId]);

  // 채팅 입력 및 정답 처리
  const handleInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userId = localStorage.getItem('userId');
    socket.emit('chat', { roomId, userId, message: inputMessage.trim() });
    if (inputMessage.trim() === currentWord && userId !== currentDrawer) {
      socket.emit('correctAnswer', { roomId, userId });
    }
    setInputMessage('');
  };

  // 게임 시작 버튼 클릭
  const startGame = () => {
    socket.emit('startGame', { roomId, round: 1 });
    setFinalResultVisible(false);
  };

  // 방 나가기
  const handleLeaveRoom = () => {
    const userId = localStorage.getItem('userId');
    socket.emit('leaveRoom', { roomId, userId });
    navigate('/');
  };

  if (joinFailed) {
    return <JoinFailedModal reason={joinFailedReason} onConfirm={() => navigate('/')} />;
  }

  // 제시어 표시 조건
  const displayWord =
    roundSummary
      ? ''
      : currentDrawer === localStorage.getItem('userId')
      ? currentWord
      : gameStatus === 'playing'
      ? '???'
      : '';

  // 남은 시간 표시 조건
  const displayTime = roundSummary ? '' : timeLeft;

  return (
    <div>
      <LookDrawGalleryModal
        isVisible={lookDrawVisible}
        drawings={savedDrawings}
        onClose={() => setLookDrawVisible(false)}
      />

      <RoundSummaryModal
        isVisible={!!roundSummary}
        onClose={() => {
          setRoundSummary(null);
          setGameStatus('playing');
        }}
        round={roundSummary?.round || currentRound}
        word={roundSummary?.word || currentWord}
        correctUser={roundSummary?.correctUser || null}
        gainedScore={roundSummary?.gainedScore || 0}
        players={roundSummary?.players || []}
      />

      <FinalResultModal
        isVisible={finalResultVisible}
        players={players}
        roomId={roomId!}
        onRetry={startGame}
        onLeave={handleLeaveRoom}
        onShowLookDraw={() => setLookDrawVisible(true)}
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
        {players.find((p) => p.userId === localStorage.getItem('userId') && p.isHost) && (
          <button
            onClick={startGame}
            disabled={gameStatus === 'playing'}
            style={{
              padding: '10px 24px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
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
          {roundSummary ? (
            <>요약 중...</>
          ) : gameStatus === 'playing' || gameStatus === 'summary' ? (
            <>
              제시어: {displayWord} / ⏱ {displayTime}s
            </>
          ) : gameStatus === 'countdown' ? (
            <>게임 시작까지 {countdown}초</>
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

      <div style={{ width: '100%', maxWidth: 1400, display: 'flex', marginBottom: 100 }}>
        <form onSubmit={handleInput} style={{ flex: 1, display: 'flex', marginRight: 300, padding: '0 16px' }}>
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="채팅을 입력하세요..."
            style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16, marginRight: 8 }}
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
