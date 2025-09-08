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

function HomePageContent() {
  const [roomCode, setRoomCode] = useState(null);

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
      }
    };
    checkUserInRoom();
  }, []);

  if (roomCode) {
    return <Navigate to={`/room/${roomCode}`} replace />;
  }

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
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePageContent />} />
        <Route path="/join" element={<RoomJoinPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </Router>
  );
}
