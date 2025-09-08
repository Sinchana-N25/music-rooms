// backend/server.js

const express = require("express");
const cors = require("cors");

// Create the Express app
const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows requests from other origins (our frontend)
app.use(express.json()); // Allows us to read JSON from the body of requests

// A simple test route to make sure the server is working
app.get("/", (req, res) => {
  res.send("Hello from the Express Server!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
