// backend/models/Room.js

const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  host: {
    type: String,
    required: true,
    unique: true,
  },
  guest_can_pause: {
    type: Boolean,
    required: true,
    default: false,
  },
  votes_to_skip: {
    type: Number,
    required: true,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
