import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Typography, Button } from "@mui/material";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";
export default function Room() {
  const [roomDetails, setRoomDetails] = useState({
    votesToSkip: 2,
    guestCanPause: false,
    isHost: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [song, setSong] = useState(null);
  const { roomCode } = useParams();
  const navigate = useNavigate();

  // Fetch details when the component mounts
  useEffect(() => {
    // The getRoomDetails function is now defined inside useEffect
    const getRoomDetails = () => {
      fetch(`${import.meta.env.VITE_API_URL}/api/get-room?code=${roomCode}`, {
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            navigate("/"); // Redirect home if room not found
          }
          return response.json();
        })
        .then((data) => {
          setRoomDetails({
            votesToSkip: data.votes_to_skip,
            guestCanPause: data.guest_can_pause,
            isHost: data.is_host,
          });
        });
    };
    getRoomDetails();
  }, [roomCode, navigate]); // `Maps` is added as a dependency by convention

  // This runs after we have the room details
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/is-authenticated`,
          { credentials: "include" }
        );
        const data = await response.json();
        setSpotifyAuthenticated(data.status);
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    // Only check auth status if we know the user is the host
    if (roomDetails.isHost) {
      checkAuthStatus();
    }
  }, [roomDetails.isHost]); // Re-run when isHost changes

  useEffect(() => {
    // This interval will poll for the current song every second
    const interval = setInterval(() => {
      getCurrentSong();
    }, 1000);

    // This is a cleanup function that React runs when the component unmounts
    return () => clearInterval(interval);
  }, []); // The empty array means this effect runs only once on mount

  const authenticateSpotify = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/get-auth-url`,
        { credentials: "include" }
      );
      const data = await response.json();
      // Redirect the current window to the Spotify login page
      window.location.replace(data.url);
    } catch (error) {
      console.error("Error authenticating with Spotify:", error);
    }
  };

  const leaveButtonPressed = () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };
    fetch(
      `${import.meta.env.VITE_API_URL}/api/leave-room`,
      requestOptions
    ).then(() => {
      // The unused '_response' variable is removed
      navigate("/");
    });
  };

  // The function to re-fetch details after an update is now separate
  const updateCallback = () => {
    // We need a separate function to pass to the child component
    // We can't pass the one inside useEffect
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
  };

  const renderSettings = () => (
    <Grid container spacing={1} direction="column" alignItems="center">
      <Grid item xs={12}>
        <CreateRoomPage
          update={true}
          votesToSkipProp={roomDetails.votesToSkip}
          guestCanPauseProp={roomDetails.guestCanPause}
          roomCode={roomCode}
          updateCallback={updateCallback}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setShowSettings(false)}
        >
          Close
        </Button>
      </Grid>
    </Grid>
  );

  const getCurrentSong = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/current-song`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 204) {
          // No song is playing
          setSong(null);
          return null;
        }
        if (!response.ok) {
          console.error("Error fetching current song:", response.status);
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setSong(data);
        }
      })
      .catch((err) => {
        console.error("Error in getCurrentSong:", err);
      });
  };

  const renderRoomDetails = () => (
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
      {roomDetails.isHost && !spotifyAuthenticated && (
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="success"
            onClick={authenticateSpotify}
          >
            Authenticate Spotify
          </Button>
        </Grid>
      )}
      {/* --- RENDER THE MUSIC PLAYER --- */}
      <Grid item xs={12}>
        <MusicPlayer
          song={song}
          isHost={roomDetails.isHost}
          guestCanPause={roomDetails.guestCanPause}
        />
      </Grid>
      {roomDetails.isHost && (
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </Button>
        </Grid>
      )}
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="secondary"
          onClick={leaveButtonPressed}
        >
          Leave Room
        </Button>
      </Grid>
    </Grid>
  );

  return showSettings ? renderSettings() : renderRoomDetails();
}
