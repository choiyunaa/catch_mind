import React from 'react';

interface Player {
  nickname: string;
  score: number;
}

interface FinalResultModalProps {
  isVisible: boolean;
  players: Player[];
  roomId: string;
  onRetry: () => void;
  onLeave: () => void;
  onShowLookDraw: () => void; // ✅ 그림 보기 모달 오픈 콜백
}

const FinalResultModal: React.FC<FinalResultModalProps> = ({
  isVisible,
  players,
  onRetry,
  onLeave,
  onShowLookDraw,
}) => {
  if (!isVisible) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999
    }}>
      <div style={{
        width: 500,
        backgroundColor: '#fff',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: 24 }}>🏆 최종 결과</h2>
        <ol style={{ textAlign: 'left', paddingLeft: 24, marginBottom: 24 }}>
          {sortedPlayers.map((player, index) => (
            <li key={index} style={{ marginBottom: 8, fontSize: 18 }}>
              <strong>{index + 1}위</strong> - {player.nickname} : {player.score}점
            </li>
          ))}
        </ol>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button onClick={onRetry} style={{
            padding: '12px 24px', borderRadius: 8,
            backgroundColor: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold'
          }}>다시하기</button>

          <button
            onClick={onShowLookDraw} // ✅ 페이지 이동 ❌ → 모달 트리거 ✅
            style={{
              padding: '12px 24px', borderRadius: 8,
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            그림 보기
          </button>

          <button onClick={onLeave} style={{
            padding: '12px 24px', borderRadius: 8,
            backgroundColor: '#e53935', color: '#fff', border: 'none', fontWeight: 'bold'
          }}>나가기</button>
        </div>
      </div>
    </div>
  );
};

export default FinalResultModal;
