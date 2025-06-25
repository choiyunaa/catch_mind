import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';

interface Comment {
  content: string;
  author: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  nickname: string;
  images: string[];
  createdAt: string;
  likedUserIds: string[]; // 추천한 사용자 ID 목록
  comments?: Comment[]; // 옵셔널 처리
}

export default function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null); // 로그인 사용자 ID 저장

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`http://localhost:9999/api/galleryposts/${id}`);
        if (!res.ok) throw new Error('게시글 불러오기 실패');
        const data = await res.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message || '오류가 발생했습니다.');
      }
    };
    fetchPost();
  }, [id]);

  const handleAddComment = async () => {
    if (input.trim() === '') return;

    try {
      const token = localStorage.getItem('token');
      const author = localStorage.getItem('nickname');
      if (!token) throw new Error('로그인이 필요합니다.');
      if (!author) throw new Error('작성자 정보가 없습니다.');

      const res = await fetch(`http://localhost:9999/api/galleryposts/${post?._id}/comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: input.trim(), author }),
      });

      if (!res.ok) throw new Error('댓글 등록 실패');

      const updatedPost = await res.json();
      setPost(updatedPost);
      setInput('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('로그인이 필요합니다.');

      const res = await fetch(`http://localhost:9999/api/galleryposts/${post?._id}/like`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('추천 처리 실패');

      const updatedPost = await res.json();
      setPost(updatedPost);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!post) return <div>로딩 중...</div>;

  const likedUserIds = Array.isArray(post.likedUserIds) ? post.likedUserIds : [];
  const likeCount = likedUserIds.length;
  const userLiked = userId ? likedUserIds.includes(userId) : false;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Header />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <h1 style={{ marginBottom: 16 }}>{post.title}</h1>

        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            marginBottom: 24,
            color: '#555',
            fontSize: '14px',
          }}
        >
          <span>{post.nickname}</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleString()}</span>
          <span>·</span>
          <span>추천 {likeCount}</span>
        </div>

        {post.images && post.images.length > 0 && (
          <img
            src={`http://localhost:9999${post.images[0]}`}
            alt={post.title}
            style={{
              width: '100%',
              maxHeight: 400,
              objectFit: 'contain',
              borderRadius: 8,
              marginBottom: 24,
            }}
          />
        )}

        <p style={{ whiteSpace: 'pre-line', marginBottom: 24 }}>{post.description}</p>

        <button
          onClick={handleToggleLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'transparent',
            color: '#000',
            padding: '8px 16px',
            border: userLiked ? '2px solid #3b82f6' : '2px solid #999',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 32,
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          <span style={{ fontSize: 20 }}>👍</span> 추천 {likeCount}
        </button>

        <div>
          <h3>댓글</h3>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="댓글을 입력하세요"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
          <button
            onClick={handleAddComment}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            등록
          </button>

          <ul style={{ marginTop: 16, listStyle: 'none', paddingLeft: 0 }}>
            {(post.comments ?? []).map((comment, idx) => (
              <li
                key={idx}
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  wordBreak: 'break-word',
                }}
              >
                <strong>{comment.author}</strong> ({new Date(comment.createdAt).toLocaleString()}):
                <br />
                {comment.content}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
