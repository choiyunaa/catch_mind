import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface Gallerypost {
  _id: string;
  title: string;
  description: string;
  images: string[];
  createdAt: string;
}

export default function MyPage() {
  const [posts, setPosts] = useState<Gallerypost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMyPosts() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }

        const res = await fetch('http://localhost:9999/api/galleryposts/mine', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('내 글을 불러오는데 실패했습니다.');

        const data = await res.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchMyPosts();
  }, []);

  if (loading) return <div>불러오는 중...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Header />
      <div style={{ maxWidth: 1200, margin: '20px auto', padding: '16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>내가 쓴 글</h2>
        {posts.length === 0 && <p>아직 작성한 글이 없습니다.</p>}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'flex-start',
          }}
        >
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/gallery/${post._id}`)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                padding: 16,
                width: 240,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              {post.images && post.images.length > 0 ? (
                <img
                  src={`http://localhost:9999${post.images[0]}`}
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'contain',
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 8,
                    backgroundColor: '#f0f0f0',
                    marginBottom: 12,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#aaa',
                  }}
                >
                  이미지 없음
                </div>
              )}
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#4b5563',
                  marginBottom: 8,
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {post.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#4b5563',
                  textAlign: 'left',
                  width: '100%',
                  marginBottom: 8,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={post.description}
              >
                {post.description || '설명 없음'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                작성일: {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
