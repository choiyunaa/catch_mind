import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface User {
  _id: string;
  nickname: string;
}

interface Post {
  _id: string;
  title: string;
  userId: User | null;
  likedUserIds: string[];
  images: string[];
  createdAt: string;
  likes: number; // 프론트에서 계산용
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>('');

  const fallbackImages = ['/image1.png', '/image2.png', '/image3.png', '/image4.png'];
  const getRandomFallbackImage = () =>
    fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:9999/api/galleryposts');
        if (!res.ok) throw new Error('게시글 불러오기 실패');
        const data = await res.json();
        console.log('서버 응답 데이터:', data);

        const fixedData = data.map((post: any) => ({
          ...post,
          likes: Array.isArray(post.likedUserIds) ? post.likedUserIds.length : 0,
        }));
        setPosts(fixedData);
      } catch (err: any) {
        setError(err.message || '오류가 발생했습니다.');
      }
    };
    fetchPosts();
  }, []);

  const splitSubtitle = (nickname: string, likes: number) => ({
    firstLine: nickname,
    secondLine: `추천수: ${likes}`,
  });

  const getMedalBg = (type: string) => {
    switch (type) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#C0C0C0';
    }
  };

  const topRankers = [...posts]
    .sort((a, b) => {
      const likeDiff = b.likes - a.likes;
      if (likeDiff !== 0) return likeDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3)
    .map((post, index) => ({
      ...post,
      medalType: ['gold', 'silver', 'bronze'][index] || 'default',
    }));

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        {/* 명예의 전당 */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '24px' }}>
            명예의 전당
          </h2>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            {topRankers.map((item, i) => {
              const nickname = item.userId?.nickname ?? '알 수 없음';
              const { firstLine, secondLine } = splitSubtitle(nickname, item.likes);
              const imageSrc =
                item.images && item.images.length > 0
                  ? `http://localhost:9999${item.images[0]}`
                  : getRandomFallbackImage();

              return (
                <div
                  key={item._id}
                  style={{ width: '240px', cursor: 'pointer' }}
                  onClick={() => navigate(`/gallery/${item._id}`)}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '16px', zIndex: 10 }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: getMedalBg(item.medalType),
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{i + 1}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '24px',
                        paddingTop: '40px',
                        minHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                      }}
                    >
                      <img
                        src={imageSrc}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          marginBottom: '16px',
                        }}
                      />
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 'bold',
                          color: '#4b5563',
                          marginBottom: '16px',
                          width: '100%',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#4b5563',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div>작성자: {firstLine}</div>
                        <div>{secondLine}</div>
                        <div>작성일: {new Date(item.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최신순 */}
        <div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '24px',
            }}
          >
            최신순
          </h2>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
            }}
          >
            {[...posts]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((post) => {
                const nickname = post.userId?.nickname ?? '알 수 없음';
                const { firstLine, secondLine } = splitSubtitle(nickname, post.likes);
                const imageSrc =
                  post.images && post.images.length > 0
                    ? `http://localhost:9999${post.images[0]}`
                    : getRandomFallbackImage();

                return (
                  <div
                    key={post._id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '16px',
                      minHeight: '150px',
                      width: '240px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                    }}
                    onClick={() => navigate(`/gallery/${post._id}`)}
                  >
                    <img
                      src={imageSrc}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: '#4b5563',
                        marginBottom: '8px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {post.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#4b5563',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      작성자: {firstLine}
                      <br />
                      {secondLine}
                      <br />
                      작성일: {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
