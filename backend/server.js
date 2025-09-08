const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config(); // Load environment variables
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend's URL
    credentials: true,
  })
);
app.use(express.json());

// --- Add Session Middleware ---
app.use(
  session({
    secret: "supersecretkey", // In production, use an environment variable
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // In production, set to true for HTTPS
  })
);

// --- Connect to MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the Express Server!");
});

// This serves the static files from the React app's build folder
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// This is the catch-all route that sends back index.html for any other request.
// It allows React Router to handle the client-side routing.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
