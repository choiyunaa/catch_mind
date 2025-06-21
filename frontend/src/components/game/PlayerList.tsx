import React from 'react';

export interface Player {
  userId: string;
  nickname: string;
  isHost: boolean;
  score: number;
  lastMessage?: string;
  clientId?: string;
}

interface PlayerListProps {
  players?: Player[];
}

const MAX_SLOTS = 4;

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  const myUserId = localStorage.getItem('userId');

  const safePlayers = Array.isArray(players) ? players : [];

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => safePlayers[i] || null);
   
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 0,
      width: 260,
      height: 'calc(100% - 120px)',
      background: '#fff',
      borderLeft: '1px solid #eee',
      borderRadius: '24px 0 0 24px',
      padding: '32px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>플레이어 목록</h3>

      {slots.map((player, idx) => (
        <div
          key={idx}
          style={{
            width: '80%',
            height: 100,
            backgroundColor: player
              ? (player.userId === myUserId ? '#e3f2fd' : '#fafafa')
              : '#f0f0f0',
            borderRadius: 12,
            border: player && player.isHost ? '2px solid #1976d2' : '1px solid #ddd',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 12px',
            fontWeight: player && player.isHost ? 'bold' : 'normal',
            color: player ? '#000' : '#999',
            position: 'relative'
          }}
        >
          {player ? (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%'
              }}>
                <div style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {player.nickname}
                  {player.isHost && ' (호스트)'}
                </div>
                <div style={{
                  fontSize: 14,
                  color: '#666',
                  marginTop: 4
                }}>
                  점수: {player.score}
                </div>
              </div>
              {player.lastMessage && (
  <div style={{
    position: 'absolute',
    left: '-80px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#fff',
    color: '#000',
    border: '1px solid #444',
    borderRadius: 16,
    padding: '10px 14px',
    fontSize: 14,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxWidth: 120,
  }}>
    {player.lastMessage}
    {/* 꼬리 */}
    <div style={{
      content: "''",
      position: 'absolute',
      top: '50%',
      right: '-10px',
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      borderLeft: '10px solid #fff',
      filter: 'drop-shadow(1px 0 0 #444)' // 테두리 표현
    }} />
  </div>
)}
            </>
          ) : (
            <span style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 16
            }}>
              대기 중
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
