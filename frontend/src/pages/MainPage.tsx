import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRoomModal from '../components/CreateRoomModal';

interface Room {
  _id: string;
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const nickname = localStorage.getItem('nickname');

  // 공개방 목록 조회
  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:9999/api/rooms/public');
      if (!res.ok) throw new Error('방 목록을 불러오는데 실패했습니다.');
      const data = await res.json();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || '방 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // 1초마다 방 목록 갱신
    const interval = setInterval(fetchRooms, 1000);
    return () => clearInterval(interval);
  }, []);

  // 방 생성
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...roomData,
          userId,
          nickname
        })
      });

      if (!res.ok) throw new Error('방 생성에 실패했습니다.');
      
      const room = await res.json();
      setIsCreateModalOpen(false);
      // 생성된 방으로 이동 (SPA 방식)
      navigate(`/room/${room._id}`);
    } catch (err: any) {
      setError(err.message || '방 생성에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 타이틀 + 닉네임/로그아웃 한 줄 배치 */}
      <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '40px 0 0 0' }}>
        
        
      </div>
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 24 }}>
          <h1 style={{ textAlign: 'center', margin: 0, fontSize: 40, fontWeight: 900, color: '#222', flex: 'none' }}>Catch Mind</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
            {nickname && (
              <span style={{ fontWeight: 'bold', fontSize: 20, color: '#1976d2', lineHeight: '56px' }}>닉네임: {nickname}</span>
            )}
            <button onClick={handleLogout} style={{ height: 40, padding: '0 20px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #0002', lineHeight: '40px' }}>
              로그아웃
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          <button 
            style={{ flex: 1, padding: '16px 0' }}
            onClick={() => window.location.href = '/gallery'}
          >
            손맛미술관
          </button>
          <button 
            style={{ flex: 1, padding: '16px 0' }}
            onClick={() => {/* TODO: 빠른 입장 구현 */}}
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
            onClick={() => {/* TODO: 비밀방 입장 구현 */}}
          >
            비밀방 들어가기
          </button>
        </div>

        <h2 style={{ marginBottom: 16 }}>공개 방 목록</h2>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>로딩 중...</div>
          ) : rooms.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>공개 방이 없습니다.</div>
          ) : (
            rooms.map(room => (
              <div key={room._id} style={{ display: 'flex', alignItems: 'center', padding: 16, borderBottom: '1px solid #eee' }}>
                <div style={{ flex: 1 }}>
                  <b>{room.title}</b>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {room.players.length} / {room.maxPlayers}명
                  </div>
                </div>
                <button 
                  style={{ marginLeft: 16 }}
                  onClick={() => window.location.href = `/room/${room._id}`}
                >
                  입장
                </button>
              </div>
            ))
          )}
        </div>

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