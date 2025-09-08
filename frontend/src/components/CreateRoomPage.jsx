import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Button,
  Grid,
  Typography,
  TextField,
  FormHelperText,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

// We now accept props to handle update functionality
export default function CreateRoomPage({
  update = false,
  roomCode = null,
  votesToSkipProp = 2,
  guestCanPauseProp = true,
  updateCallback = () => {},
}) {
  const navigate = useNavigate();

  // The state now defaults to the props passed in for updates
  const [guestCanPause, setGuestCanPause] = useState(guestCanPauseProp);
  const [votesToSkip, setVotesToSkip] = useState(votesToSkipProp);

  const handleVotesChange = (e) => {
    setVotesToSkip(e.target.value);
  };

  const handleGuestCanPauseChange = (e) => {
    setGuestCanPause(e.target.value === "true");
  };

  const handleRoomButtonPressed = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        votes_to_skip: votesToSkip,
        guest_can_pause: guestCanPause,
      }),
    };
    fetch(`${import.meta.env.VITE_API_URL}/api/create-room`, requestOptions)
      .then((response) => response.json())
      .then((data) => navigate("/room/" + data.code));
  };

  const handleUpdateButtonPressed = () => {
    const requestOptions = {
      method: "PATCH", // Use PATCH for updates
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        votes_to_skip: votesToSkip,
        guest_can_pause: guestCanPause,
        code: roomCode,
      }),
    };
    fetch(
      `${import.meta.env.VITE_API_URL}/api/update-room`,
      requestOptions
    ).then((response) => {
      if (response.ok) {
        console.log("Room updated successfully");
      } else {
        console.error("Failed to update room");
      }
      updateCallback(); // Call the callback to refresh the parent component
    });
  };

  // Dynamically set the title and button text based on whether we are updating
  const title = update ? "Update Room" : "Create a Room";

  return (
    <Grid container spacing={1} direction="column" alignItems="center">
      <Grid item xs={12}>
        <Typography component="h4" variant="h4">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormHelperText>
            <div align="center">Guest Control of Playback State</div>
          </FormHelperText>
          <RadioGroup
            row
            value={guestCanPause.toString()}
            onChange={handleGuestCanPauseChange}
          >
            <FormControlLabel
              value="true"
              control={<Radio color="primary" />}
              label="Play/Pause"
              labelPlacement="bottom"
            />
            <FormControlLabel
              value="false"
              control={<Radio color="secondary" />}
              label="No Control"
              labelPlacement="bottom"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl>
          <TextField
            required
            type="number"
            onChange={handleVotesChange}
            value={votesToSkip}
            inputProps={{ min: 1, style: { textAlign: "center" } }}
          />
          <FormHelperText sx={{ textAlign: "center" }}>
            Votes Required To Skip Song
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Button
          color="primary"
          variant="contained"
          onClick={update ? handleUpdateButtonPressed : handleRoomButtonPressed}
        >
          {update ? "Update Room" : "Create A Room"}
        </Button>
      </Grid>
      {/* The back button only shows when creating a new room */}
      {!update && (
        <Grid item xs={12}>
          <Button
            color="secondary"
            variant="contained"
            to="/"
            component={RouterLink}
          >
            Back
          </Button>
        </Grid>
      )}
    </Grid>
  );
}
