const mongoose = require("mongoose");

const SpotifyTokenSchema = new mongoose.Schema({
  user: {
    type: String, // This will be the user's session ID
    required: true,
    unique: true,
  },
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  token_type: { type: String, required: true },
  expires_in: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SpotifyToken", SpotifyTokenSchema);
