import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function GalleryWrite() {
  const navigate = useNavigate();

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이미지 유무 검사 (버튼은 항상 활성화)
    if (!image) {
      alert('이미지는 반드시 업로드해야 합니다.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/auth');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('title', title);
      formData.append('description', description);

      const res = await fetch('http://localhost:9999/api/galleryposts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '작품 등록 실패');
      }

      alert('작품이 등록되었습니다.');
      navigate('/gallery');
    } catch (error: any) {
      alert(error.message || '서버 오류');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>작품 등록</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 이미지 업로드 */}
          <div>
            <label style={{ fontWeight: 'bold' }}>이미지 업로드</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <img
                src={preview}
                alt="미리보기"
                style={{ marginTop: '12px', width: '100%', borderRadius: '8px' }}
              />
            )}
          </div>

          {/* 제목 */}
          <div>
            <label style={{ fontWeight: 'bold' }}>제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* 설명 */}
          <div>
            <label style={{ fontWeight: 'bold' }}>설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* 제출 버튼 (항상 활성화) */}
          <button
            type="submit"
            style={{
              backgroundColor: '#3b82f6',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            작품 등록하기
          </button>
        </form>
      </div>
    </div>
  );
}
