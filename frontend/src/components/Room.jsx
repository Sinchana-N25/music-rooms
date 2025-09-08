import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Grid, Typography } from "@mui/material";

export default function Room() {
  const [roomDetails, setRoomDetails] = useState({
    votesToSkip: 2,
    guestCanPause: false,
    isHost: false,
  });
  const { roomCode } = useParams();

  useEffect(() => {
    // Use environment variable and include credentials
    fetch(`${import.meta.env.VITE_API_URL}/api/get-room?code=${roomCode}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setRoomDetails({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
      });
  }, [roomCode]);

  return (
    <Grid container spacing={1} direction="column" alignItems="center">
      <Grid item>
        <Typography variant="h4" component="h4">
          Code: {roomCode}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="body1">
          Votes to Skip: {roomDetails.votesToSkip}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="body1">
          Guest Can Pause: {String(roomDetails.guestCanPause)}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="body1">
          Is Host: {String(roomDetails.isHost)}
        </Typography>
      </Grid>
    </Grid>
  );
}
