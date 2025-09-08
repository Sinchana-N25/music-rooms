// frontend/src/components/SpotifyWebPlayer.jsx

import React, { useState, useEffect } from "react";

// This component receives the access token as a prop
export default function SpotifyWebPlayer({ accessToken }) {
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    // This function runs when the accessToken is available
    if (!accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("✅ Ready with Device ID", device_id);
        // Transfer playback to this new device
        const requestOptions = {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ device_id }),
        };
        fetch(
          `${import.meta.env.VITE_API_URL}/api/transfer-playback`,
          requestOptions
        );
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      spotifyPlayer.connect();
    };

    // Cleanup function to remove the player when the component unmounts
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken, player]); // Rerun effect if accessToken changes

  return null; // This component doesn't render any visible UI
}
