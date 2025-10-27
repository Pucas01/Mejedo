import express from "express"
import bcrypt from "bcryptjs"
import {db} from "../dbHelper.js" // your sqlite3 db
import requireAuth from "../authMiddleware.js"
const router = express.Router();
const SALT_ROUNDS = 10; // same as in db.js


// ------------------ LOGIN ------------------ //
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid username or password" });

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ success: true, user: req.session.user });
  });
});

// ------------------ CHECK LOGGED IN ------------------ 
router.get("/me", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Not logged in" });
  res.json({ user: req.session.user });
});

// ------------------ LOGOUT ------------------ 
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ------------------ GET USERS ------------------
router.get("/", requireAuth, (req, res) => {
  db.all("SELECT username, role FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows });
  });
});

// ------------------ ADD USER ------------------ 
router.post("/", requireAuth, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, hashedPassword, role || "user"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, user: { id: this.lastID, username, role: role || "user" } });
    }
  );
});

// ------------------ DELETE USER ------------------
router.delete("/:username", requireAuth, (req, res) => {
  const { username } = req.params;
  db.run("DELETE FROM users WHERE username = ?", [username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  });
});

// ------------------ CHANGE PASSWORD ------------------
router.put("/:username/password", requireAuth, async (req, res) => {
  const { username } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required" });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  db.run("UPDATE users SET password = ? WHERE username = ?", [hashed, username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

export default router;