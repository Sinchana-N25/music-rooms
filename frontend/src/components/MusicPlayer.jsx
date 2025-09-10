// frontend/src/components/MusicPlayer.jsx

import React from "react";
import {
  Grid,
  Typography,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
  Box,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";

export default function MusicPlayer({ song, isHost, guestCanPause }) {
  if (!song || !song.id) {
    return null; // Don't render anything if there's no song
  }

  const songProgress = (song.time / song.duration) * 100;

  const playSong = () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };
    fetch(`${import.meta.env.VITE_API_URL}/api/play`, requestOptions);
  };

  const pauseSong = () => {
    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };
    fetch(`${import.meta.env.VITE_API_URL}/api/pause`, requestOptions);
  };

  const skipSong = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };
    fetch(`${import.meta.env.VITE_API_URL}/api/skip`, requestOptions);
  };

  return (
    <Card
      sx={{
        maxWidth: 600,
        margin: "20px auto",
        borderRadius: 2,
        boxShadow: 3,
        display: "flex",
        alignItems: "center",
        p: 1.25,
      }}
    >
      {/* Left: Album Art */}
      <CardMedia
        component="img"
        image={song.image_url}
        alt="Album Art"
        sx={{
          width: 120,
          height: 120,
          borderRadius: 2,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />

      {/* Right: Song Info + Controls */}
      <Box
        className="music-player"
        sx={{
          flex: 1,
          ml: 5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          className="music-title"
          component="h5"
          variant="subtitle1"
          fontWeight="semibold"
          noWrap
        >
          {song.title}
        </Typography>
        <Typography
          className="music-artist"
          component="h5"
          variant="body2"
          noWrap
        >
          {song.artist}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <IconButton
            size="small"
            color="primary"
            // The button is disabled if the user doesn't have permission
            disabled={!isHost && !guestCanPause}
            onClick={() => (song.is_playing ? pauseSong() : playSong())}
          >
            {song.is_playing ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton size="small" color="primary" onClick={skipSong}>
            <SkipNextIcon />
          </IconButton>
          {/* --- ADD VOTE COUNTER --- */}
          <Typography className="votes" variant="body2">
            ({song.votes} / {song.votes_required})
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={songProgress}
          sx={{ mt: 1, borderRadius: 1, height: 5 }}
        />
      </Box>
    </Card>
  );
}
