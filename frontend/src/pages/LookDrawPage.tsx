// src/pages/LookDrawPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const LookDrawPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchDrawings = async () => {
    const token = localStorage.getItem('accessToken'); // ✅ 토큰 가져오기

    try {
      const res = await fetch(`/api/lookdraw/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('접근 권한이 없거나 방이 존재하지 않음');
      const data = await res.json();
      setImages(data.drawings);
    } catch (err) {
      console.error(err);
      alert('그림을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  fetchDrawings();
}, [roomId]);


  if (loading) return <div>불러오는 중...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🎨 {roomId} 방의 그림 모음</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div key={index} className="border rounded shadow p-2">
            <img src={img} alt={`Round ${index + 1}`} className="w-full h-auto" />
            <p className="mt-2 text-center">Round {index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LookDrawPage;
