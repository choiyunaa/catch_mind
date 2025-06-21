// components/game/RoundSummaryModal.tsx

import React from 'react';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  round: number;
  word: string;
  correctUser: string | null;
  gainedScore: number;
  players?: { nickname: string; score: number }[];
}

const RoundSummaryModal: React.FC<Props> = ({
  isVisible,
  onClose,
  round,
  word,
  correctUser,
  gainedScore,
  players,
}) => {
  if (!isVisible) return null;

  const sortedPlayers = Array.isArray(players)
  ? [...players].sort((a, b) => b.score - a.score)
  : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          minWidth: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: 16 }}>🎉 라운드 {round} 요약</h2>
        <p>정답: <strong>{word}</strong></p>
        <p>
          정답자: {correctUser ? (
            <strong>{correctUser} (+{gainedScore})</strong>
          ) : (
            '없음'
          )}
        </p>
        <hr style={{ margin: '20px 0' }} />
        <h3>🏆 순위</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sortedPlayers.map((p, i) => (
            <li key={i}>{i + 1}위 - {p.nickname} ({p.score}점)</li>
          ))}
        </ul>
      </div>
    </div>
  );
};


export default RoundSummaryModal;
