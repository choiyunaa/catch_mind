const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  password: { type: String }, // 비밀방인 경우에만 사용
  maxPlayers: { type: Number, required: true, min: 2, max: 4 },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nickname: String,
    isHost: Boolean,
    score: { type: Number, default: 0 }
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentRound: { type: Number, default: 0 },
  maxRounds: { type: Number, default: 3 },
  currentDrawer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentWord: String,
  startTime: Date,
  endTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema); 