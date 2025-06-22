import React from 'react';

interface JoinFailedModalProps {
  reason: string;
  onConfirm: () => void;
}

const JoinFailedModal: React.FC<JoinFailedModalProps> = ({ reason, onConfirm }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 8,
          width: 320,
          textAlign: 'center',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        }}
      >
        <h2>방 입장 실패</h2>
        <p>{reason}</p>
        <button
          onClick={onConfirm}
          style={{
            marginTop: 16,
            padding: '10px 24px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default JoinFailedModal;
