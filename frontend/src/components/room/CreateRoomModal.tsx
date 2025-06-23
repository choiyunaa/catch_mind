// 파일 경로: src/components/room/CreateRoomModal.tsx

import React, { useState } from 'react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    title: string;
    isPrivate: boolean;
    maxPlayers: number;
  }) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreateRoom }) => {
  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({ title, isPrivate, maxPlayers });

    // 입력 초기화
    setTitle('');
    setIsPrivate(false);
    setMaxPlayers(3);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          width: 400,
          maxWidth: '90%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>방 만들기</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>방 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: 8, fontSize: 16 }}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              비밀방으로 만들기
            </label>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>최대 인원수</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              style={{ width: '100%', padding: 8, fontSize: 16 }}
            >
              <option value={2}>2명</option>
              <option value={3}>3명</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: 10,
                backgroundColor: '#e0e0e0',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: 10,
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
