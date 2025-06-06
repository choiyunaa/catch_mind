const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

router.get('/public', async (req, res) => {
  try {
    // 공개방만 조회 (isPrivate: false, status: waiting)
    const rooms = await Room.find({ isPrivate: false, status: 'waiting' });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, isPrivate, maxPlayers, userId, nickname } = req.body;
    
    const newRoom = await Room.create({
      title,
      isPrivate,
      maxPlayers,
      players: [{
        userId,
        nickname,
        isHost: true,  // 방 생성자를 호스트로 설정
        score: 0
      }],
      status: 'waiting'
    });
    res.status(201).json(newRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;