import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000'; // NestJS 서버 주소

const GameComponent: React.FC<{ roomId: string; nickname: string }> = ({ roomId, nickname }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [word, setWord] = useState<string>('');
  const [drawer, setDrawer] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('소켓 연결됨:', newSocket.id);
      newSocket.emit('joinRoom', { roomId, userId: newSocket.id, nickname });
    });

    newSocket.on('roomUpdate', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('gameStarted', (data) => {
      setGameStarted(true);
      setDrawer(data.drawer);
      console.log('게임 시작! 라운드:', data.round);
    });

    newSocket.on('word', (data) => {
      if (data.userId === newSocket.id) {
        setWord(data.word);
        alert(`당신이 그리는 사람입니다! 단어: ${data.word}`);
      }
    });

    newSocket.on('gameEnd', (data) => {
      setGameStarted(false);
      alert('게임 종료!');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, nickname]);

  const onStartGame = () => {
    if (!socket) return;
    socket.emit('startGame', { roomId });
  };

  return (
    <div>
      <h2>플레이어 목록</h2>
      <ul>
        {players.map(p => (
          <li key={p.userId}>{p.nickname} {drawer?.userId === p.userId ? '(그리는 사람)' : ''}</li>
        ))}
      </ul>
      <button onClick={onStartGame} disabled={gameStarted}>게임 시작</button>
      {word && <div>제시어: {word}</div>}
    </div>
  );
};

export default GameComponent;
