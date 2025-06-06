const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, nickname, password } = req.body;
    if (!username || !nickname || !password) {
      return res.status(400).json({ message: '모든 필드를 입력하세요.' });
    }
    // 중복 체크
    const exists = await User.findOne({ $or: [ { username }, { nickname } ] });
    if (exists) {
      return res.status(409).json({ message: 'ID 또는 닉네임이 이미 존재합니다.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, nickname, password: hash });
    await user.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: '존재하지 않는 ID입니다.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    const token = jwt.sign({ userId: user._id, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, nickname: user.nickname, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// ID/닉네임 중복 체크
router.get('/check', async (req, res) => {
  const { username, nickname } = req.query;
  let exists = null;
  if (username) exists = await User.findOne({ username });
  if (nickname) exists = await User.findOne({ nickname });
  res.json({ exists: !!exists });
});

// 방 정보 조회
router.get('/:roomId', async (req, res) => {
  const room = await Room.findById(req.params.roomId);
  if (!room) return res.status(404).json({ message: '방이 없습니다.' });
  res.json(room);
});

// 방 정보 수정 (방장만)
router.patch('/:roomId', async (req, res) => {
  // 인증/권한 체크 필요
  const room = await Room.findByIdAndUpdate(req.params.roomId, req.body, { new: true });
  res.json(room);
});

// 공통 방 퇴장/삭제 함수
async function handleLeaveRoom(roomId, userId, io) {
  console.log('handleLeaveRoom', roomId, userId);
  const room = await Room.findById(roomId);
  if (!room) return;
  console.log('Room.players before:', room.players.map(p => p.userId && p.userId.toString()));
  room.players = room.players.filter(p => p.userId && p.userId.toString() !== userId);
  console.log('Room.players after:', room.players.map(p => p.userId && p.userId.toString()));
  if (room.players.length === 0) {
    await Room.deleteOne({ _id: roomId });
    console.log(`Room ${roomId} deleted (no players left)`);
    return;
  }
  await room.save();
  io.to(roomId).emit('room:players', room.players);
}

module.exports = router; 