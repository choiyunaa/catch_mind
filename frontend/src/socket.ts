// src/socket.ts
import { io } from 'socket.io-client';

const token = localStorage.getItem('token');

const socket = io('http://localhost:9999/game', {
  withCredentials: true,
  auth: { token: token || '' },
  transports: ['websocket'], // 강제 websocket만 사용
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
