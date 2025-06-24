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
  const [logoutHover, setLogoutHover] = useState(false);
  const [btnHover, setBtnHover] = useState<{ [key: string]: boolean }>({});
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
      const userId = localStorage.getItem('userId');
      const nickname = localStorage.getItem('nickname');

      if (!token || !userId || !nickname) {
        setError('로그인이 필요합니다.');
        return;
      }

      const res = await fetch('http://localhost:9999/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...roomData, userId, nickname }),
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
    <div style={styles.page}>
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

      {/* 헤더 */}
      <header style={styles.header}>
        <h1 style={styles.logo}>🎨 그림짱이 된 일찐짱</h1>
        <div style={styles.userBox}>
          {nickname && (
            <span style={styles.nickname}>👤 {nickname}</span>
          )}
          <button
            style={{
              ...styles.logoutBtn,
              ...(logoutHover ? styles.logoutBtnHover : {}),
            }}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 */}
      <main style={styles.container}>
        <div style={styles.buttonGrid}>
          <button
            style={{
              ...styles.mainBtn,
              ...(btnHover['gallery'] ? styles.mainBtnHover : {}),
            }}
            onMouseEnter={() => setBtnHover({ ...btnHover, gallery: true })}
            onMouseLeave={() => setBtnHover({ ...btnHover, gallery: false })}
            onClick={() => (window.location.href = '/gallery')}
          >
            🖼 손맛미술관
          </button>

          <button
            style={{
              ...styles.mainBtn,
              ...(btnHover['quickJoin'] ? styles.mainBtnHover : {}),
            }}
            onMouseEnter={() => setBtnHover({ ...btnHover, quickJoin: true })}
            onMouseLeave={() => setBtnHover({ ...btnHover, quickJoin: false })}
            onClick={handleQuickJoin}
          >
            ⚡ 빠른 입장
          </button>

          <button
            style={{
              ...styles.mainBtn,
              ...(btnHover['createRoom'] ? styles.mainBtnHover : {}),
            }}
            onMouseEnter={() => setBtnHover({ ...btnHover, createRoom: true })}
            onMouseLeave={() => setBtnHover({ ...btnHover, createRoom: false })}
            onClick={() => setIsCreateModalOpen(true)}
          >
            ➕ 방 만들기
          </button>

          <button
            style={{
              ...styles.mainBtn,
              ...(btnHover['privateRoom'] ? styles.mainBtnHover : {}),
            }}
            onMouseEnter={() => setBtnHover({ ...btnHover, privateRoom: true })}
            onMouseLeave={() => setBtnHover({ ...btnHover, privateRoom: false })}
            onClick={() => setIsPrivateModalOpen(true)}
          >
            🔒 비밀방
          </button>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 style={styles.sectionTitle}>공개 방 목록</h2>
          <PublicRoomList
            rooms={rooms}
            loading={loading}
            error={error}
            onEnterRoom={handleEnterRoom}
          />
        </div>

        <CreateRoomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateRoom={handleCreateRoom}
        />
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#f9fbfc', // 거의 흰색에 가까운 연한 블루
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '24px 96px',
    backgroundColor: '#dae9f4', // 밝고 부드러운 하늘색
    color: '#274c5e', // 짙은 청록
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  logo: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '1.5px',
    color: '#274c5e',
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
  },
  nickname: {
    fontSize: 20,
    fontWeight: 700,
    color: '#274c5e',
  },
  logoutBtn: {
    backgroundColor: '#77919d', // 중간 톤 블루그레이
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'background-color 0.3s ease',
  },
  logoutBtnHover: {
    backgroundColor: '#7f9eb2', // 밝은 블루그레이
  },
  container: {
    maxWidth: 1000,
    width: '100%',
    margin: '0 auto',
    padding: '50px 36px',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
  },
  mainBtn: {
    backgroundColor: '#77919d', // 중간 톤 블루그레이
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '20px 0',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 10px rgba(119, 145, 157, 0.4)',
    transition: 'background-color 0.3s ease, transform 0.15s ease',
  },
  mainBtnHover: {
    backgroundColor: '#7f9eb2', // 밝은 블루그레이
    transform: 'scale(1.05)',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 800,
    marginBottom: 24,
    borderBottom: '3px solid #77919d',
    paddingBottom: 8,
    color: '#274c5e',
  },
};

export default MainPage;
