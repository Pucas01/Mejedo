import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const router = express.Router();
const DB_FILE = path.join(process.cwd(), "config", "medjed.db");
const db = new sqlite3.Database(DB_FILE);

const DEFAULT_ADMIN = { username: "admin", password: "admin123" };
const SALT_ROUNDS = 10;

// Helper to run SQL with Promises
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Initialize database
async function initDB() {
  try {
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      )
    `);

    const admin = await getAsync(`SELECT * FROM users WHERE username = ?`, [DEFAULT_ADMIN.username]);
    if (!admin) {
      const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);
      await runAsync(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        [DEFAULT_ADMIN.username, hashed, "admin"]
      );
      console.log(`✅ Default admin created: ${DEFAULT_ADMIN.username}/${DEFAULT_ADMIN.password}`);
    } else {
      console.log("✅ Default admin already exists");
    }
  } catch (err) {
    console.error("DB Initialization error:", err);
  }
}

// Call initialization immediately
initDB();

export {db};
