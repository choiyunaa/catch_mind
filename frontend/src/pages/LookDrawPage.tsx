import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LookDrawPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchDrawings = async () => {
    const token = localStorage.getItem('token');
    console.log('token:', token);
    if (!token) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
      navigate('/login'); 
      return;
    }

    try {
      const res = await fetch(`/api/lookdraw/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          alert('로그인 정보가 만료되었습니다. 다시 로그인해주세요.');
          navigate('/login');
          return;
        }
        throw new Error('접근 권한이 없거나 방이 존재하지 않음');
      }
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
}, [roomId, navigate]);


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
