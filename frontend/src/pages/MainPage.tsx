// src/pages/MainPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRoomModal from '../components/room/CreateRoomModal';
import PublicRoomList from '../components/room/PublicRoomList';
import JoinFailedModal from '../components/game/JoinFailedModal';
import JoinPrivateRoomModal from '../components/room/JoinPrivateRoomModal';

interface Room {
  _id: string;
  roomId: string;
  title: string;
  isPrivate: boolean;
  maxPlayers: number;
  players: Array<{
    userId: string;
    nickname: string;
    isHost: boolean;
  }>;
  status: 'waiting' | 'playing' | 'finished';
}

const MainPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinFailed, setJoinFailed] = useState(false);
  const [joinFailedReason, setJoinFailedReason] = useState('');
  const navigate = useNavigate();
  const nickname = localStorage.getItem('nickname');

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:9999/api/rooms/public');
      if (!res.ok) throw new Error('방 목록을 불러오는데 실패했습니다.');
      const data = await res.json();
      setRooms(data);
      setError('');
    } catch (err: any) {
      setError(err.message || '방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = async (roomData: {
    title: string;
    isPrivate: boolean;
    maxPlayers: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const userId = localStorage.getItem('userId');
      const nickname = localStorage.getItem('nickname');
      if (!userId || !nickname) {
        setError('로그인이 필요합니다.');
        return;
      }

      const res = await fetch('http://localhost:9999/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...roomData,
          userId,
          nickname,
        }),
      });

      if (!res.ok) throw new Error('방 생성에 실패했습니다.');

      const room = await res.json();
      setIsCreateModalOpen(false);
      navigate(`/room/${room.roomId}`);
    } catch (err: any) {
      setError(err.message || '방 생성에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  const handleQuickJoin = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const nickname = localStorage.getItem('nickname');

      if (!token || !userId || !nickname) {
        setJoinFailedReason('로그인이 필요합니다.');
        setJoinFailed(true);
        return;
      }

      const res = await fetch('http://localhost:9999/api/rooms/quick-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, nickname }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setJoinFailedReason(errorData.message || '빠른 입장에 실패했습니다.');
        setJoinFailed(true);
        return;
      }

      const room = await res.json();
      navigate(`/room/${room.roomId}`);
    } catch (err: any) {
      setJoinFailedReason(err.message || '빠른 입장에 실패했습니다.');
      setJoinFailed(true);
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#f5f5f5' }}>
      {joinFailed && (
        <JoinFailedModal
          reason={joinFailedReason}
          onConfirm={() => setJoinFailed(false)}
        />
      )}

      <JoinPrivateRoomModal
        isOpen={isPrivateModalOpen}
        onClose={() => setIsPrivateModalOpen(false)}
        onJoin={(roomId) => navigate(`/room/${roomId}`)}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '40px 0 0 0',
        }}
      />

      <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            gap: 24,
          }}
        >
          <h1
            style={{
              textAlign: 'center',
              margin: 0,
              fontSize: 40,
              fontWeight: 900,
              color: '#222',
              flex: 'none',
            }}
          >
            Catch Mind
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
            {nickname && (
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: 20,
                  color: '#1976d2',
                  lineHeight: '56px',
                }}
              >
                닉네임: {nickname}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                height: 40,
                padding: '0 20px',
                background: '#e53935',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #0002',
                lineHeight: '40px',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          <button
            style={{ flex: 1, padding: '16px 0' }}
            onClick={() => (window.location.href = '/gallery')}
          >
            손맛미술관
          </button>
          <button
            style={{ flex: 1, padding: '16px 0' }}
            onClick={handleQuickJoin}
          >
            빠른 입장
          </button>
          <button
            style={{ flex: 1, padding: '16px 0' }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            방 만들기
          </button>
          <button
            style={{ flex: 1, padding: '16px 0' }}
            onClick={() => setIsPrivateModalOpen(true)}
          >
            비밀방 들어가기
          </button>
        </div>

        <h2 style={{ marginBottom: 16 }}>공개 방 목록</h2>

        <PublicRoomList
          rooms={rooms}
          loading={loading}
          error={error}
          onEnterRoom={handleEnterRoom}
        />

        <CreateRoomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateRoom={handleCreateRoom}
        />
      </div>
    </div>
  );
};

export default MainPage;
