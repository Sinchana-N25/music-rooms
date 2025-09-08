const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const SpotifyToken = require("../models/SpotifyToken");

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

router.get("/get-room", async (req, res) => {
  const { code } = req.query;
  try {
    const room = await Room.findOne({ code });
    if (room) {
      // Add a field to check if the current user is the host
      const isHost = req.session.id === room.host;
      return res.status(200).json({ ...room.toObject(), is_host: isHost });
    }
    return res.status(404).json({ error: "Room not found" });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

// Checks if the user's session is already in a room
router.get("/user-in-room", (req, res) => {
  if (req.session.room_code) {
    return res.status(200).json({ code: req.session.room_code });
  }
  return res.status(200).json({ code: null });
});

// Handles joining a room
router.post("/join-room", async (req, res) => {
  const { code } = req.body;
  try {
    const room = await Room.findOne({ code });
    if (room) {
      req.session.room_code = code; // Store room code in session
      return res.status(200).json({ message: "Room Joined!" });
    }
    return res.status(404).json({ error: "Room not found" });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/leave-room", (req, res) => {
  // When a user leaves, we just clear the room_code from their session
  req.session.room_code = null;
  return res.status(200).json({ message: "Room Left" });
});

router.patch("/update-room", async (req, res) => {
  try {
    const { code, guest_can_pause, votes_to_skip } = req.body;
    const host = req.session.id;

    // Find the room by its code
    const room = await Room.findOne({ code });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if the person making the request is the host
    if (room.host !== host) {
      return res
        .status(403)
        .json({ error: "You are not the host of this room." });
    }

    // Update the room's properties
    room.guest_can_pause = guest_can_pause;
    room.votes_to_skip = votes_to_skip;
    await room.save();

    return res.status(200).json(room);
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

// This is the endpoint that Spotify redirects to after the user logs in
router.get("/spotify-callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Callback Error: ${error}`);
  }

  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
    });

    const { access_token, refresh_token, expires_in, token_type } =
      response.data;
    const user = req.session.id;

    // Use findOneAndUpdate with upsert to create or update the token
    await SpotifyToken.findOneAndUpdate(
      { user },
      { access_token, refresh_token, expires_in, token_type },
      { upsert: true, new: true }
    );

    // Redirect the user back to the room they were in
    res.redirect(`http://localhost:5173/room/${req.session.room_code}`);
  } catch (err) {
    res.status(500).send("Error retrieving access token");
  }
});

// This lets our frontend quickly check if the current user has a token
router.get("/is-authenticated", async (req, res) => {
  const token = await SpotifyToken.findOne({ user: req.session.id });
  if (token) {
    return res.status(200).json({ status: true });
  }
  return res.status(200).json({ status: false });
});

router.get("/get-auth-url", (req, res) => {
  const scopes =
    "user-read-playback-state user-modify-playback-state user-read-currently-playing";
  const url =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scopes,
      redirect_uri: process.env.REDIRECT_URI,
    }).toString();

  res.status(200).json({ url });
});

module.exports = router;
