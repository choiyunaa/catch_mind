import { io } from 'socket.io-client';

const socket = io('http://localhost:9999/game', {
  withCredentials: true,
});

export default socket;
