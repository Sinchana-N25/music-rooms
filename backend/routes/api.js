const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// Helper function to generate a unique room code
const generateUniqueCode = async () => {
  while (true) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingRoom = await Room.findOne({ code });
    if (!existingRoom) {
      return code;
    }
  }
};

router.post("/create-room", async (req, res) => {
  try {
    const { guest_can_pause, votes_to_skip } = req.body;
    const host = req.session.id; // Use the session ID as the unique host identifier

    // Check if a room with this host already exists
    let room = await Room.findOne({ host });

    if (room) {
      // If it exists, update it
      room.guest_can_pause = guest_can_pause;
      room.votes_to_skip = votes_to_skip;
      await room.save();
      return res.status(200).json(room);
    } else {
      // If it doesn't exist, create a new one
      const code = await generateUniqueCode();
      room = new Room({
        host,
        guest_can_pause,
        votes_to_skip,
        code,
      });
      await room.save();
      return res.status(201).json(room);
    }
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
