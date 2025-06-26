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

      <header style={styles.header}>
        <h1 style={styles.logo}>
          <span style={styles.logoHighlight}>🎨</span> 그림짱이 된 일찐짱
        </h1>
        <div style={styles.userBox}>
          {nickname && (
            <span style={styles.nickname}>
              <i className="fas fa-user-circle" style={{ marginRight: '8px' }}></i>
              {nickname}
            </span>
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

      <main style={styles.container}>
        <section style={styles.ctaSection}>
          <h3 style={styles.ctaSubtitle}>새로운 그림 실력을 뽐내거나, 친구들과 함께 즐겨보세요!</h3>
          <div style={styles.buttonGrid}>
            <button
              style={{
                ...styles.mainBtn,
                ...(btnHover['gallery'] ? styles.mainBtnHover : {}),
              }}
              onMouseEnter={() => setBtnHover({ ...btnHover, gallery: true })}
              onMouseLeave={() => setBtnHover({ ...btnHover, gallery: false })}
              onClick={() => navigate('/gallery')}
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
        </section>

        <section style={styles.publicRoomSection}>
          <h2 style={styles.sectionTitle}>
            <i className="fas fa-users" style={{ marginRight: '10px' }}></i>
            현재 공개 방 목록
          </h2>
          <PublicRoomList
            rooms={rooms}
            loading={loading}
            error={error}
            onEnterRoom={handleEnterRoom}
          />
        </section>

        <CreateRoomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateRoom={handleCreateRoom}
        />
      </main>

      <footer style={styles.footer}>
        <p>&copy; 2025 그림짱이 된 일찐짱. All rights reserved.</p>
        <div style={styles.footerLinks}>
          <a href="" style={styles.footerLink}>개인정보처리방침</a>
          <a href="" style={styles.footerLink}>이용약관</a>
          <a href="" style={styles.footerLink}>문의하기</a>
        </div>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#F7F9FC',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Noto Sans KR', sans-serif", 
    color: '#333',
    scrollBehavior: 'smooth',
  },
  header: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '20px 80px',
    backgroundColor: '#FFFFFF',
    color: '#2C3E50',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid #E0E6ED',
  },
  logo: {
    margin: 0,
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#34495E',
    textShadow: '2px 2px 4px rgba(0,0,0,0.08)',
  },
  logoHighlight: {
    color: '#1ABC9C', 
    marginRight: '8px',
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 25,
  },
  nickname: {
    fontSize: 19,
    fontWeight: 700,
    color: '#2C3E50',
    padding: '10px 18px',
    backgroundColor: '#EBF3F8', 
    borderRadius: 25,
    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
  },
  logoutBtn: {
    backgroundColor: '#E74C3C',
    color: '#fff',
    border: 'none',
    borderRadius: 25,
    padding: '12px 28px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 5px 12px rgba(231, 76, 60, 0.25)',
    letterSpacing: '0.5px',
    fontSize: 16,
  },
  logoutBtnHover: {
    backgroundColor: '#C0392B', 
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 16px rgba(231, 76, 60, 0.4)',
  },
  container: {
    maxWidth: 1200,
    width: '100%',
    margin: '60px auto',
    padding: '0 40px',
    flexGrow: 1,
  },
  ctaSection: {
    textAlign: 'center',
    marginBottom: 80,
    padding: '50px 30px',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },
  ctaTitle: {
    fontSize: 40,
    fontWeight: 900,
    color: '#34495E',
    marginBottom: 15,
    letterSpacing: '1px',
    textShadow: '1px 1px 3px rgba(0,0,0,0.05)',
  },
  ctaSubtitle: {
    fontSize: 20,
    color: '#555',
    marginBottom: 40,
    lineHeight: 1.6,
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 35,
    justifyContent: 'center',
  },
  mainBtn: {
    backgroundColor: '#7f9eb2',
    color: '#fff',
    border: 'none',
    borderRadius: 18,
    padding: '30px 0',
    fontSize: 22,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(52, 152, 219, 0.3)',
    transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexDirection: 'column',
  },
  mainBtnHover: {
    backgroundColor: '#2980B9',
    transform: 'translateY(-8px)',
    boxShadow: '0 15px 35px rgba(52, 152, 219, 0.5)',
  },
  publicRoomSection: {
    marginTop: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    padding: '40px',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 30,
    borderBottom: '4px solid #3498DB',
    paddingBottom: 15,
    color: '#34495E',
    textAlign: 'center',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '30px 80px',
    marginTop: 'auto', 
    backgroundColor: '#34495E',
    color: '#ECF0F1',
    textAlign: 'center',
    fontSize: 15,
    boxShadow: '0 -4px 15px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: 30,
  },
  footerLink: {
    color: '#BDC3C7',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  footerLinkHover: {
    color: '#FFFFFF',
  },
};

export default MainPage;