// src/components/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      position: 'sticky',
      top: 0, 
      backgroundColor: '#ffffff', 
      zIndex: 1000,
      padding: '16px 0',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 16px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
          손맛 미술관 *⸜( •ᴗ• )⸝*
        </h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span
            style={{ cursor: 'pointer', color: '#374151', fontSize: '14px' }}
            onClick={() => navigate('/gallery/write')}
          >
            글쓰기
          </span>
          <span
            style={{ cursor: 'pointer', color: '#374151', fontSize: '14px' }}
            onClick={() => navigate('/')}
          >
            로비로 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
}
