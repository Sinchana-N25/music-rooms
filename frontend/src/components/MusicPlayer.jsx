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

export default function MusicPlayer({ song }) {
  if (!song || !song.id) {
    return null; // Don't render anything if there's no song
  }

  const songProgress = (song.time / song.duration) * 100;

  return (
    <Card
      sx={{
        maxWidth: 800,
        margin: "20px auto",
        borderRadius: 2,
        boxShadow: 3,
        display: "flex",
        alignItems: "center",
        p: 1,
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
      <Box sx={{ flex: 1, ml: 2, display: "flex", flexDirection: "column" }}>
        <Typography component="h5" variant="subtitle1" fontWeight="bold" noWrap>
          {song.title}
        </Typography>
        <Typography color="text.secondary" variant="body2" noWrap>
          {song.artist}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <IconButton size="small" color="primary">
            {song.is_playing ? (
              <PauseIcon fontSize="small" />
            ) : (
              <PlayArrowIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton size="small" color="primary">
            <SkipNextIcon fontSize="small" />
          </IconButton>
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
