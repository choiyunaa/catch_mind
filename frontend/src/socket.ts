import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');  // 서버 주소에 맞게 바꾸기!

export default socket;
