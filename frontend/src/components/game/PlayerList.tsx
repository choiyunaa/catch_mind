import React from 'react';

export interface Player {
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
  lastMessage?: string;
  clientId?: string; // 🔧 optional로 추가
}

interface PlayerListProps {
  players: Player[];
}

const MAX_SLOTS = 4;

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  const myUserId = localStorage.getItem('userId');

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => players[i] || null);

  return (
    <div style={{ position: 'absolute', top: 20, right: 0, width: 260, height: 'calc(100% - 120px)', background: '#fff', borderLeft: '1px solid #eee', borderRadius: '24px 0 0 24px', padding: '32px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>플레이어 목록</h3>

      {slots.map((player, idx) => (
        <div key={idx} style={{ width: '80%', height: 100, backgroundColor: player ? (player.userId === myUserId ? '#e3f2fd' : '#fafafa') : '#f0f0f0', borderRadius: 12, border: player && player.isHost ? '2px solid #1976d2' : '1px solid #ddd', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 12px', fontWeight: player && player.isHost ? 'bold' : 'normal', color: player ? '#000' : '#999' }}>
          {player ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {player.nickname || '닉네임 없음'}
                {player.isHost ? ' (호스트)' : ''}
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                점수: {player.score}
              </div>
            </div>
          ) : (
            <span style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 16 }}>
              대기 중
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
