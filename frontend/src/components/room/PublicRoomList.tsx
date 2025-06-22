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
    <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>로딩 중...</div>
      ) : error ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'red' }}>{error}</div>
      ) : rooms.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>공개 방이 없습니다.</div>
      ) : (
        rooms.map((room) => {
          const isFull = room.players.length >= room.maxPlayers;
          const isPlaying = room.status === 'playing';

          const canJoin = room.status === 'waiting' && !isFull;

          // 상태 텍스트와 색깔
          let statusText = '';
          let statusColor = '';
          if (room.status === 'waiting') {
            statusText = '대기 중';
            statusColor = '#43a047'; // 초록
          } else if (room.status === 'playing') {
            statusText = '게임 중';
            statusColor = '#e53935'; // 빨강
          } else if (room.status === 'finished') {
            statusText = '종료됨';
            statusColor = '#9e9e9e'; // 회색
          }

          return (
            <div
              key={room._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 16,
                borderBottom: '1px solid #eee',
                backgroundColor: isPlaying ? '#f0f0f0' : canJoin ? '#f9fff9' : '#fff5f5',
                opacity: canJoin || isPlaying ? 1 : 0.6,
              }}
            >
              <div style={{ flex: 1 }}>
                <b>{room.title}</b> {room.isPrivate && '🔒'}
                <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
                  {room.players.length} / {room.maxPlayers}명 —{' '}
                  <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusText}</span>
                </div>
              </div>
              <button
                disabled={!canJoin}
                style={{
                  marginLeft: 16,
                  padding: '6px 14px',
                  backgroundColor: canJoin ? '#1976d2' : '#9e9e9e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: canJoin ? 'pointer' : 'not-allowed',
                }}
                onClick={() => onEnterRoom(room.roomId)}
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

export default PublicRoomList;
