// src/components/room/PublicRoomList.tsx
import React from 'react';

interface Player {
  userId: string;
  nickname: string;
  isHost: boolean;
}

interface Room {
  _id: string;
  roomId: string;
  title: string;
  isPrivate: boolean;
  maxPlayers: number;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
}

interface PublicRoomListProps {
  rooms: Room[];
  loading: boolean;
  error: string;
  onEnterRoom: (roomId: string) => void;
}

const PublicRoomList: React.FC<PublicRoomListProps> = ({ rooms, loading, error, onEnterRoom }) => {
  return (
    <div style={styles.listWrapper}>
      {loading ? (
        <div style={styles.message}>로딩 중...</div>
      ) : error ? (
        <div style={{ ...styles.message, color: '#e53935' }}>{error}</div>
      ) : rooms.length === 0 ? (
        <div style={{ ...styles.message, color: '#77919d' }}>공개 방이 없습니다.</div>
      ) : (
        rooms.map((room) => {
          const isFull = room.players.length >= room.maxPlayers;
          const isPlaying = room.status === 'playing';
          const canJoin = room.status === 'waiting' && !isFull;

          // 상태 텍스트와 색깔
          let statusText = '';
          let statusColor = '';

          if (room.status === 'waiting') {
            if (isFull) {
              statusText = '입장 불가';
              statusColor = '#e53935'; // 빨강
            } else {
              statusText = '대기 중';
              statusColor = '#43a047'; // 초록
            }
          } else if (room.status === 'playing') {
            statusText = '게임 중';
            statusColor = '#e53935'; // 빨강
          } else if (room.status === 'finished') {
            statusText = '종료됨';
            statusColor = '#77919d'; // 블루그레이
          }

          return (
            <div
              key={room._id}
              style={{
                ...styles.roomItem,
                backgroundColor: canJoin ? '#e9f1f8' : isPlaying ? '#dae9f4' : '#f5f8fb',
                opacity: canJoin || isPlaying ? 1 : 0.7,
                cursor: canJoin ? 'pointer' : 'default',
              }}
              onClick={() => canJoin && onEnterRoom(room.roomId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canJoin) onEnterRoom(room.roomId);
              }}
              role={canJoin ? 'button' : undefined}
              tabIndex={canJoin ? 0 : -1}
            >
              <div style={styles.roomInfo}>
                <div style={styles.titleRow}>
                  <b style={styles.roomTitle}>{room.title}</b>
                  {room.isPrivate && <span style={styles.lockIcon}>🔒</span>}
                </div>
                <div style={{ ...styles.statusRow, color: statusColor }}>
                  {room.players.length} / {room.maxPlayers}명 —{' '}
                  <span style={{ ...styles.statusText, color: statusColor }}>{statusText}</span>
                </div>
              </div>

              <button
                disabled={!canJoin}
                style={{
                  ...styles.enterBtn,
                  backgroundColor: canJoin ? '#77919d' : '#b0b8bf',
                  cursor: canJoin ? 'pointer' : 'not-allowed',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canJoin) onEnterRoom(room.roomId);
                }}
              >
                {canJoin ? '입장' : isFull ? '인원 초과' : '게임 중'}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  listWrapper: {
    borderRadius: 10,
    backgroundColor: '#dae9f4', // 밝은 하늘색 계열
    padding: 8,
    boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
    maxHeight: 480,
    overflowY: 'auto',
  },
  message: {
    padding: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 600,
    color: '#274c5e',
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    marginBottom: 8,
    borderRadius: 8,
    transition: 'background-color 0.3s ease',
    userSelect: 'none',
  },
  roomInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  roomTitle: {
    fontSize: 18,
    color: '#274c5e',
  },
  lockIcon: {
    fontSize: 18,
    color: '#7f9eb2',
  },
  statusRow: {
    fontSize: 14,
    marginTop: 4,
  },
  statusText: {
    fontWeight: '700',
  },
  enterBtn: {
    marginLeft: 24,
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '0 4px 8px rgba(119, 145, 157, 0.6)',
    transition: 'background-color 0.3s ease',
  },
};

export default PublicRoomList;
