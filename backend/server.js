import express from "express";
import dotenv from "dotenv";
import spotifyRoute from "./routes/spotify.js"
import guestbook from "./routes/guestbook.js"
import counter from "./routes/moeCounter.js"
import users from "./routes/users.js"
import projectsRouter from "./routes/projects.js";
import requireAuth from "./authMiddleware.js"
import session from "express-session"
import cors from "cors";
import * as crypto from 'crypto';


const SESSION_SECRET = crypto.randomBytes(64).toString("hex");
const PORT = 4000
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  }
}));


app.use(express.json());
app.use("/api/spotify-now-playing", spotifyRoute);
app.use("/api/guestbook", guestbook);
app.use("/api/counter", counter);
app.use("/api/users", users);
app.use("/api/projects", projectsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
