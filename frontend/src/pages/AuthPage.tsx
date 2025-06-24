// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:9999/api/auth';

type Mode = 'login' | 'register';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUsername('');
    setNickname('');
    setPassword('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!username || !nickname || !password) {
          setMessage('모든 필드를 입력하세요.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, nickname, password }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('nickname', data.nickname);
          localStorage.setItem('userId', data.userId);
          setMessage('회원가입 성공!');
          navigate('/');
        } else {
          setMessage(data.message || '회원가입 실패');
        }
      } else {
        if (!username || !password) {
          setMessage('ID와 비밀번호를 입력하세요.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('nickname', data.nickname);
          localStorage.setItem('userId', data.userId);
          setMessage('로그인 성공!');
          navigate('/');
        } else {
          setMessage(data.message || '로그인 실패');
        }
      }
    } catch (err) {
      setMessage('서버 오류');
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h2 style={styles.title}>{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            autoComplete="username"
            required
            disabled={loading}
          />
          {mode === 'register' && (
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={styles.input}
              autoComplete="nickname"
              required
              disabled={loading}
            />
          )}
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            disabled={loading}
          />
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div style={styles.toggleBox}>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              reset();
            }}
            style={styles.toggleBtn}
            disabled={loading}
          >
            {mode === 'login' ? '회원가입' : '로그인'}으로 전환
          </button>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              color: message.includes('성공') ? '#43a047' : '#e53935',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundImage: 'url("/backgroundimg.png")',
    backgroundSize: 'cover',       // 이미지 꽉 채우기
    backgroundPosition: 'center',  // 중앙 정렬
    backgroundRepeat: 'no-repeat', // 반복 안함
  },
  box: {
    width: 360,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 12px 24px rgba(39, 76, 94, 0.2)',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    marginBottom: 24,
    color: '#274c5e',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    padding: '12px 14px',
    fontSize: 16,
    borderRadius: 10,
    border: '2px solid #77919d',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  },
  submitBtn: {
    padding: 14,
    fontSize: 18,
    borderRadius: 10,
    backgroundColor: '#274c5e',
    color: '#fff',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 6px 12px rgba(39, 76, 94, 0.3)',
    transition: 'background-color 0.3s ease',
  },
  toggleBox: {
    marginTop: 24,
    textAlign: 'center',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#77919d',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: 14,
    textDecoration: 'underline',
  },
  message: {
    marginTop: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
};

export default AuthPage;
