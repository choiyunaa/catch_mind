import React from 'react';

interface LookDrawGalleryModalProps {
  isVisible: boolean;
  drawings: string[];
  onClose: () => void;
}

const LookDrawGalleryModal: React.FC<LookDrawGalleryModalProps> = ({
  isVisible,
  drawings,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '80%',
          maxHeight: '80%',
          backgroundColor: '#fff',
          padding: 24,
          borderRadius: 12,
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>🎨 그림 갤러리</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#e53935',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {drawings.length > 0 ? (
            drawings.map((image, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 8,
                  backgroundColor: '#f9f9f9',
                }}
              >
                <img
                  src={image}
                  alt={`그림 ${index + 1}`}
                  style={{ width: '100%', borderRadius: 6 }}
                />
                <p style={{ textAlign: 'center', marginTop: 8 }}>Round {index + 1}</p>
              </div>
            ))
          ) : (
            <p>저장된 그림이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LookDrawGalleryModal;
