// backend/spotify.js

const axios = require("axios");
const SpotifyToken = require("./models/SpotifyToken");

const refreshToken = async (session_id) => {
  const token = await SpotifyToken.findOne({ user: session_id });
  if (!token) return null;

  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
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

    const { access_token, expires_in, token_type } = response.data;
    token.access_token = access_token;
    token.expires_in = expires_in;
    token.token_type = token_type;
    token.createdAt = Date.now(); // Reset the creation time
    await token.save();

    return token;
  } catch (error) {
    console.error(
      "Error refreshing token:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

const isTokenExpired = (token) => {
  const { expires_in, createdAt } = token;
  const expiryTime = new Date(createdAt).getTime() + expires_in * 1000;
  return expiryTime < Date.now();
};

async function executeSpotifyApiRequest(user, endpoint, method = "GET") {
  try {
    const token = await SpotifyToken.findOne({ user });
    if (!token) {
      return { error: "No token found" };
    }

    const headers = {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    };

    const response = await axios({
      method,
      url: `https://api.spotify.com/v1${endpoint}`,
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Spotify API request error:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    return { error: "Spotify API request failed" };
  }
}

module.exports = { executeSpotifyApiRequest };
