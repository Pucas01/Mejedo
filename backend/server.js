import express from "express";
import dotenv from "dotenv";
import spotifyRoute from "./routes/spotify.js";
import guestbook from "./routes/guestbook.js"

dotenv.config();

const PORT = 4000
const app = express();

app.use(express.json());
app.use("/api/spotify-now-playing", spotifyRoute);
app.use("/api/guestbook", guestbook);

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
