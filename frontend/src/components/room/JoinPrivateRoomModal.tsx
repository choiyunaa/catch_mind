import React, { useState } from 'react';

interface JoinPrivateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (roomCode: string) => void;
}

const JoinPrivateRoomModal: React.FC<JoinPrivateRoomModalProps> = ({ isOpen, onClose, onJoin }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoin(roomCode.trim().toUpperCase());
      setRoomCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 999,
    }}>
      <div style={{
        backgroundColor: '#fff', padding: 24, borderRadius: 8,
        width: 400, maxWidth: '90%', boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: 20 }}>비밀방 입장</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="방 코드 입력"
            style={{
              width: '100%', padding: 10, fontSize: 16,
              marginBottom: 20, borderRadius: 4, border: '1px solid #ccc',
            }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', backgroundColor: '#ddd', border: 'none', borderRadius: 4 }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}
            >
              입장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinPrivateRoomModal;
