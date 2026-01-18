import express from "express"
import bcrypt from "bcryptjs"
import {db} from "../dbHelper.js"
import requireAuth from "../authMiddleware.js"
import fs from "fs"
import path from "path"

const router = express.Router();
const SALT_ROUNDS = 10;
const DISCORD_CONFIG_FILE = path.join(process.cwd(), "config", "discord-webhook.json");

// This is some reused user code from another project

// Discord notification for failed login
const sendFailedLoginNotification = async (username, password, ip) => {
  try {
    if (!fs.existsSync(DISCORD_CONFIG_FILE)) {
      return;
    }

    const config = JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE));
    if (!config.webhookUrl || !config.enabled) {
      return;
    }

    const embed = {
      title: "Failed Login Attempt",
      color: 0xff6b6b, // Red/orange
      fields: [
        {
          name: "Username Attempted",
          value: username || "N/A",
          inline: true
        },
        {
          name: "Password Attempted",
          value: password ? `\`${password}\`` : "N/A",
          inline: true
        },
        {
          name: "IP Address",
          value: ip || "Unknown",
          inline: false
        },
        {
          name: "Timestamp",
          value: new Date().toLocaleString(),
          inline: true
        }
      ],
      footer: {
        text: "Security Alert • Login Failed"
      }
    };

    await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: config.userId ? `<@${config.userId}>` : undefined,
        username: "PucasBot Security",
        avatar_url: "https://galaxypfp.com/wp-content/uploads/2025/10/futaba-pfp.webp",
        embeds: [embed]
      })
    });

    console.log("Discord failed login notification sent successfully");
  } catch (error) {
    console.error("Failed to send Discord login notification:", error.message);
  }
};

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  // Get IP address
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      // Send notification for non-existent user
      sendFailedLoginNotification(username, password, ip).catch(err =>
        console.error("Discord failed login notification error:", err)
      );
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Send notification for wrong password
      sendFailedLoginNotification(username, password, ip).catch(err =>
        console.error("Discord failed login notification error:", err)
      );
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ success: true, user: req.session.user });
  });
});

router.get("/me", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Not logged in" });
  res.json({ user: req.session.user });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/", requireAuth, (req, res) => {
  db.all("SELECT username, role FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows });
  });
});

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

router.delete("/:username", requireAuth, (req, res) => {
  const { username } = req.params;
  db.run("DELETE FROM users WHERE username = ?", [username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  });
});

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