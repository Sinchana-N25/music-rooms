import React from "react";
import { useParams } from "react-router-dom";

export default function Room() {
  const { roomCode } = useParams();

  return (
    <div>
      <h3>Room Code: {roomCode}</h3>
    </div>
  );
}
