import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const DATA_FILE = path.join(process.cwd(), "config", "guestbook.json");
const CONFIG_DIR = path.join(process.cwd(), "config");
const DISCORD_CONFIG_FILE = path.join(process.cwd(), "config", "discord-webhook.json");

if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Discord webhook notification
const sendDiscordNotification = async (messageData) => {
  try {
    if (!fs.existsSync(DISCORD_CONFIG_FILE)) {
      return;
    }

    const config = JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE));
    if (!config.webhookUrl || !config.enabled) {
      return;
    }

    const embed = {
      title: "New Guestbook Entry",
      color: 0x39ff14, // Neon green
      fields: [
        {
          name: "Name",
          value: messageData.name,
          inline: true
        },
        {
          name: "Website",
          value: messageData.website || "N/A",
          inline: true
        },
        {
          name: "Message",
          value: messageData.message.length > 1024 ? messageData.message.substring(0, 1021) + "..." : messageData.message,
          inline: false
        },
        {
          name: "Timestamp",
          value: new Date(messageData.timestamp).toLocaleString(),
          inline: true
        }
      ],
      footer: {
        text: "Guestbook notification • Awaiting approval"
      }
    };

    await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: config.userId ? `<@${config.userId}>` : undefined,
        username: "PucasBot",
        avatar_url: "https://galaxypfp.com/wp-content/uploads/2025/10/futaba-pfp.webp",
        embeds: [embed]
      })
    });

    console.log("Discord notification sent successfully");
  } catch (error) {
    console.error("Failed to send Discord notification:", error.message);
    // Don't throw error - notification failure shouldn't break guestbook
  }
};

// Discord notification for approval
const sendApprovalNotification = async (messageData) => {
  try {
    if (!fs.existsSync(DISCORD_CONFIG_FILE)) {
      return;
    }

    const config = JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE));
    if (!config.webhookUrl || !config.enabled) {
      return;
    }

    const embed = {
      title: "Guestbook Entry Approved",
      color: 0x00ff00, // Green
      fields: [
        {
          name: "Name",
          value: messageData.name,
          inline: true
        },
        {
          name: "Website",
          value: messageData.website || "N/A",
          inline: true
        },
        {
          name: "Message",
          value: messageData.message.length > 1024 ? messageData.message.substring(0, 1021) + "..." : messageData.message,
          inline: false
        }
      ],
      footer: {
        text: "This entry is now publicly visible"
      }
    };

    await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "PucasBot",
        avatar_url: "https://galaxypfp.com/wp-content/uploads/2025/10/futaba-pfp.webp",
        embeds: [embed]
      })
    });

    console.log("Discord approval notification sent successfully");
  } catch (error) {
    console.error("Failed to send Discord approval notification:", error.message);
  }
};

// Discord notification for deletion
const sendDeletionNotification = async (messageData) => {
  try {
    if (!fs.existsSync(DISCORD_CONFIG_FILE)) {
      return;
    }

    const config = JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE));
    if (!config.webhookUrl || !config.enabled) {
      return;
    }

    const embed = {
      title: "Guestbook Entry Deleted",
      color: 0xff0000, // Red
      fields: [
        {
          name: "Name",
          value: messageData.name,
          inline: true
        },
        {
          name: "Website",
          value: messageData.website || "N/A",
          inline: true
        },
        {
          name: "Message",
          value: messageData.message.length > 1024 ? messageData.message.substring(0, 1021) + "..." : messageData.message,
          inline: false
        }
      ],
      footer: {
        text: "This entry has been removed"
      }
    };

    await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "PucasBot",
        avatar_url: "https://galaxypfp.com/wp-content/uploads/2025/10/futaba-pfp.webp",
        embeds: [embed]
      })
    });

    console.log("Discord deletion notification sent successfully");
  } catch (error) {
    console.error("Failed to send Discord deletion notification:", error.message);
  }
};

// read/write messages
const readMessages = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeMessages = (msgs) => fs.writeFileSync(DATA_FILE, JSON.stringify(msgs, null, 2));

// GET all approved messages (for public users)
router.get("/", (req, res) => {
  try {
    const messages = readMessages().filter((m) => m.approved);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all messages (for admin, including pending)
router.get("/admin", (req, res) => {
  try {
    const messages = readMessages();
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new message (pending approval)
router.post("/", async (req, res) => {
  try {
    const { name, message, website } = req.body;
    if (!name || !message) return res.status(400).json({ error: "Name and message required" });

    const messages = readMessages();
    const newMessage = {
      id: Date.now(),
      name,
      message,
      website: website || "",
      timestamp: new Date().toISOString(),
      approved: false,
      reply: "",
    };

    messages.push(newMessage);
    writeMessages(messages);

    // Send Discord notification (non-blocking)
    sendDiscordNotification(newMessage).catch(err =>
      console.error("Discord notification error:", err)
    );

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH approve a message
router.patch("/approve/:id", async (req, res) => {
  try {
    const messages = readMessages();
    const msg = messages.find((m) => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.approved = true;
    writeMessages(messages);

    // Send Discord notification (non-blocking)
    sendApprovalNotification(msg).catch(err =>
      console.error("Discord approval notification error:", err)
    );

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reply to a message
router.patch("/reply/:id", (req, res) => {
  try {
    const { reply } = req.body;
    const messages = readMessages();
    const msg = messages.find((m) => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.reply = reply || "";
    writeMessages(messages);
    writeMessages(messages);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a message
router.delete("/:id", async (req, res) => {
  try {
    const messages = readMessages();
    const msgIndex = messages.findIndex((m) => m.id == req.params.id);
    if (msgIndex === -1) return res.status(404).json({ error: "Message not found" });

    const deletedMsg = messages[msgIndex];
    messages.splice(msgIndex, 1);
    writeMessages(messages);

    // Send Discord notification (non-blocking)
    sendDeletionNotification(deletedMsg).catch(err =>
      console.error("Discord deletion notification error:", err)
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
