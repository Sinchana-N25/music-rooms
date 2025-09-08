const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
