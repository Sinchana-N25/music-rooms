const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const axios = require("axios");
const { executeSpotifyApiRequest } = require("../spotify");
const SpotifyToken = require("../models/SpotifyToken");

const songVotes = {};

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
      //  Make sure host also has room_code in session
      req.session.room_code = room.code;
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
      // Store the new room_code in session for the host
      req.session.room_code = code;
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
// --- Spotify Callback ROUTE ---
router.get("/spotify-callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  try {
    // Exchange code for access + refresh tokens
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, refresh_token, expires_in, token_type } =
      response.data;

    // Find the room where this session belongs
    const roomCode = req.session.room_code || state; // fallback if you’re passing room code in `state`
    const room = await Room.findOne({ code: roomCode });

    if (!room) {
      console.error("⚠️ No room found for code:", roomCode);
      return res.redirect("http://localhost:5173"); // fallback redirect
    }

    // Always tie token to the HOST of the room
    const user = room.host;

    await SpotifyToken.findOneAndUpdate(
      { user },
      {
        access_token,
        refresh_token,
        expires_in,
        token_type,
        created_at: Date.now(),
      },
      { upsert: true, new: true }
    );

    console.log("✅ Spotify tokens saved for host:", user);

    // Redirect back to frontend room page
    return res.redirect(`http://localhost:5173/room/${roomCode}`);
  } catch (error) {
    console.error(
      "❌ Error in /spotify-callback:",
      error.response?.data || error.message
    );
    return res.redirect("http://localhost:5173");
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
      state: req.session.room_code,
    }).toString();

  res.status(200).json({ url });
});

// --- Current song ROUTE ---
router.get("/current-song", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.session.room_code });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const host = room.host;
    const data = await executeSpotifyApiRequest(
      host,
      "/me/player/currently-playing"
    );

    if (data.error || !data || !data.item) {
      return res.status(204).json({ message: "No song currently playing." });
    }

    const item = data.item;

    const songId = item.id;
    const roomCode = req.session.room_code;

    // Check if the current song is different from the one we have votes for
    if (songVotes[roomCode] && !songVotes[roomCode][songId]) {
      // Song has changed, reset votes for this room
      delete songVotes[roomCode];
    }

    const votes =
      songVotes[roomCode] && songVotes[roomCode][songId]
        ? songVotes[roomCode][songId].length
        : 0;

    const song = {
      title: item.name,
      artist: item.artists.map((artist) => artist.name).join(", "),
      duration: item.duration_ms,
      time: data.progress_ms,
      image_url: item.album.images[0]?.url,
      is_playing: data.is_playing,
      votes: votes,
      votes_required: room.votes_to_skip, // Also send how many are needed
      id: item.id,
    };

    return res.status(200).json(song);
  } catch (error) {
    console.error("❌ Error in /current-song route:", error.message);
    return res.status(500).json({ error: "An error occurred" });
  }
});

// --- Playing the song route ---
router.put("/play", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.session.room_code });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    // Check if the user has permission
    if (req.session.id === room.host || room.guest_can_pause) {
      await executeSpotifyApiRequest(room.host, "/me/player/play", "put");
      return res.status(204).send(); // 204 No Content is appropriate here
    }
    return res
      .status(403)
      .json({ error: "You do not have permission to do that." });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

// --- Pausing the song route ---
router.put("/pause", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.session.room_code });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    // Check if the user has permission
    if (req.session.id === room.host || room.guest_can_pause) {
      await executeSpotifyApiRequest(room.host, "/me/player/pause", "put");
      return res.status(204).send();
    }
    return res
      .status(403)
      .json({ error: "You do not have permission to do that." });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

// --- skipping the song ROUTE ---
router.post("/skip", async (req, res) => {
  try {
    const roomCode = req.session.room_code;
    const room = await Room.findOne({ code: roomCode });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const hostSessionId = room.host;
    const currentUserSessionId = req.session.id;

    // Immediately skip if the host clicks the button
    if (currentUserSessionId === hostSessionId) {
      await executeSpotifyApiRequest(hostSessionId, "/me/player/next", "post");
      // Reset votes for this room after skipping
      if (songVotes[roomCode]) {
        delete songVotes[roomCode];
      }
      return res.status(204).send();
    }

    // --- Handle Guest Voting ---
    const songData = await executeSpotifyApiRequest(
      hostSessionId,
      "/me/player/currently-playing"
    );
    if (!songData || !songData.item) {
      return res.status(400).json({ error: "No song is currently playing." });
    }
    const songId = songData.item.id;

    // Initialize vote tracking for this room/song if it doesn't exist
    if (!songVotes[roomCode]) songVotes[roomCode] = {};
    if (!songVotes[roomCode][songId]) songVotes[roomCode][songId] = [];

    // Add user's vote if they haven't voted yet
    if (!songVotes[roomCode][songId].includes(currentUserSessionId)) {
      songVotes[roomCode][songId].push(currentUserSessionId);
    }

    const currentVotes = songVotes[roomCode][songId].length;

    // Check if votes have reached the threshold
    if (currentVotes >= room.votes_to_skip) {
      await executeSpotifyApiRequest(hostSessionId, "/me/player/next", "post");
      // Reset votes for this room after skipping
      delete songVotes[roomCode];
      return res.status(204).send();
    }

    return res.status(200).json({ message: "Vote counted." });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

// Provides the host's raw access token to the frontend
router.get("/get-host-token", async (req, res) => {
  try {
    const room = await Room.findOne({ host: req.session.id });
    if (room) {
      const token = await SpotifyToken.findOne({ user: room.host });
      if (token) {
        return res.status(200).json({ access_token: token.access_token });
      }
    }
    return res.status(404).json({ error: "Token not found for host." });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

// Tells Spotify to start playing on a new device (our browser)
router.put("/transfer-playback", async (req, res) => {
  try {
    const { device_id } = req.body;
    const host = req.session.id;

    const data = {
      device_ids: [device_id],
      play: true,
    };
    await executeSpotifyApiRequest(host, "/me/player", "put", data);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
