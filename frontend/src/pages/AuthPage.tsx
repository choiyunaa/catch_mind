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
          localStorage.setItem('token', data.token);
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
          localStorage.setItem('token', data.token);
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
    <div
      style={{
        maxWidth: 400,
        margin: '60px auto',
        padding: 24,
        border: '1px solid #eee',
        borderRadius: 8,
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
        {mode === 'login' ? '로그인' : '회원가입'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            autoComplete="username"
            required
          />
        </div>
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ width: '100%', padding: 8 }}
              autoComplete="nickname"
              required
            />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </div>
        <button
          type="submit"
          style={{ width: '100%', padding: 12 }}
          disabled={loading}
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            reset();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
          }}
        >
          {mode === 'login' ? '회원가입' : '로그인'}으로 전환
        </button>
      </div>
      {message && (
        <div
          style={{
            marginTop: 16,
            color: message.includes('성공') ? 'green' : 'red',
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthPage;
