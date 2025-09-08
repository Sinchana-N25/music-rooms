// frontend/src/components/HomePage.jsx

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link as RouterLink,
  Navigate,
} from "react-router-dom";
import { Grid, Button, ButtonGroup, Typography } from "@mui/material";

import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";

// This is the new component that will render the main page content
function RenderHomePage() {
  return (
    <Grid container spacing={3} direction="column" alignItems="center">
      <Grid item>
        <Typography variant="h3" component="h3">
          Jam Circle
        </Typography>
      </Grid>
      <Grid item>
        <ButtonGroup disableElevation variant="contained" color="primary">
          <Button color="primary" to="/join" component={RouterLink}>
            Join a Room
          </Button>
          <Button color="secondary" to="/create" component={RouterLink}>
            Create a Room
          </Button>
        </ButtonGroup>
      </Grid>
    </Grid>
  );
}

export default function HomePage() {
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserInRoom = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/user-in-room`,
          { credentials: "include" }
        );
        const data = await response.json();
        setRoomCode(data.code);
      } catch (error) {
        console.log(error);
      } finally {
        // Set loading to false after the fetch is complete
        setLoading(false);
      }
    };
    checkUserInRoom();
  }, []);

  // While loading, we render nothing to prevent the flash
  if (loading) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            // If we have a room code, redirect immediately.
            // Otherwise, render the main page content.
            roomCode ? (
              <Navigate to={`/room/${roomCode}`} replace />
            ) : (
              <RenderHomePage />
            )
          }
        />
        <Route path="/join" element={<RoomJoinPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </Router>
  );
}
