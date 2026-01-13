# Backend API Documentation

Express.js backend on port 4000 with SQLite authentication and JSON-based data storage.

## Quick Start

```bash
# Install dependencies
npm install

# Start backend server
npm run server

# Or use PM2
pm2 start ecosystem.config.js
```

**Default admin account:**
- Username: `admin`
- Password: `admin123`

## Architecture

- **Server**: Express.js on port 4000
- **Database**: SQLite3 (`config/medjed.db`) - users only
- **Data Storage**: JSON files in `config/` directory
- **File Uploads**: Stored in `public/uploads/`
- **Session**: express-session with 1-day expiration

## Authentication

### User Management

**POST** `/api/users/login`
```json
{ "username": "admin", "password": "admin123" }
```

**GET** `/api/users/me` - Get current user

**POST** `/api/users/logout` - Destroy session

**GET** `/api/users` (Admin) - List all users

**POST** `/api/users` (Admin) - Create user
```json
{ "username": "newuser", "password": "pass123", "role": "user" }
```

**DELETE** `/api/users/:username` (Admin) - Delete user

**PUT** `/api/users/:username/password` (Admin) - Change password
```json
{ "password": "newpass123" }
```

### Default Setup

On first run, creates:
- `config/medjed.db` with users table
- Default admin account (username: `admin`, password: `admin123`)

**Change admin password:**
```bash
curl -X PUT http://localhost:4000/api/users/admin/password \
  -H "Content-Type: application/json" \
  -d '{"password":"your_new_password"}' \
  --cookie "connect.sid=YOUR_SESSION_ID"
```

## Content Management

### Blog Posts

**GET** `/api/blogposts` - Get all posts

**POST** `/api/blogposts` (Admin)
```json
{
  "title": "Post Title",
  "body": "Content here...",
  "images": ["url1.jpg", "url2.jpg"],
  "publishDate": "2024-01-01",
  "readTime": "5 min"
}
```

**PUT** `/api/blogposts/:id` (Admin) - Update post

**DELETE** `/api/blogposts/:id` (Admin) - Delete post and images

Storage: `config/blogposts.json`

### Guestbook

**GET** `/api/guestbook` - Get approved messages

**GET** `/api/guestbook/admin` - Get all messages (including pending)

**POST** `/api/guestbook` - Submit message
```json
{
  "name": "Visitor",
  "message": "Great site!",
  "website": "https://example.com"
}
```

**PATCH** `/api/guestbook/approve/:id` - Approve message

**PATCH** `/api/guestbook/reply/:id` - Add reply
```json
{ "reply": "Thanks for visiting!" }
```

**DELETE** `/api/guestbook/:id` - Delete message

Storage: `config/guestbook.json`

### Collections

#### Gaming Consoles

**GET** `/api/collection` - Get all consoles

**POST** `/api/collection` (Admin)
```json
{
  "name": "PlayStation 2",
  "manufacturer": "Sony",
  "releaseYear": 2000,
  "image": "ps2.jpg",
  "games": [
    {
      "title": "Final Fantasy X",
      "releaseYear": 2001,
      "cover": "ffx.jpg"
    }
  ]
}
```

**PUT** `/api/collection/:id` (Admin) - Update console

**DELETE** `/api/collection/:id` (Admin) - Delete console

**DELETE** `/api/collection/:consoleId/games/:gameIndex` (Admin) - Delete game

**PUT** `/api/collection/:consoleId/games/:gameIndex/move` (Admin)
```json
{ "direction": "up" } // or "down"
```

Storage: `config/consoles.json`

#### Manga Collection

**GET** `/api/collectionManga` - Get all manga

**POST** `/api/collectionManga` (Admin)
```json
{
  "title": "One Piece",
  "author": "Eiichiro Oda",
  "releaseYear": 1997,
  "cover": "onepiece.jpg",
  "volumes": [
    {
      "number": 1,
      "cover": "vol1.jpg",
      "releaseYear": 1997
    }
  ]
}
```

**PUT** `/api/collectionManga/:id` (Admin) - Update manga

**DELETE** `/api/collectionManga/:id` (Admin) - Delete manga

**DELETE** `/api/collectionManga/:id/volume/:index` (Admin) - Delete volume

**PUT** `/api/collectionManga/:id/volume/move` (Admin)
```json
{ "from": 0, "to": 2 }
```

Storage: `config/manga.json`

### Shitposts

**GET** `/api/shitposts` - Get all posts (all categories)

**POST** `/api/shitposts/:category` (Admin)
```json
{
  "id": "unique-id",
  "title": "Post Title",
  "url": "https://...",
  "thumbnail": "thumb.jpg",
  "meta": { "likes": 100, "views": 1000 }
}
```

**DELETE** `/api/shitposts/:category/:id` (Admin) - Delete post

Categories: `tiktoks`, `tweets`, `tenor`, `youtube`

Storage: `config/shitposts.json`

### Speedrun Leaderboard

**GET** `/api/speedrunLeaderboard` - Get leaderboard (sorted)

**POST** `/api/speedrunLeaderboard` (Admin)
```json
{
  "name": "Player",
  "time": "1:23:45",
  "date": "2024-01-01",
  "version": "1.0",
  "notes": "Any% glitchless"
}
```

**DELETE** `/api/speedrunLeaderboard` (Admin)
```json
{ "index": 0 }
```

Storage: `config/speedrunLeaderboard.json`

## File Management

### Image Upload

**POST** `/api/upload` - Upload image (⚠️ No auth required)

Form data: `file` (image)

Returns: `{ "url": "/uploads/filename.jpg" }`

Storage: `public/uploads/`

### Music System

**GET** `/api/music` - List all music files

**POST** `/api/music/upload` (Admin) - Upload audio file

Supported: MP3, WAV, OGG, WebM, AAC, FLAC, M4A

**GET** `/api/music/:filename` - Stream music (supports range requests for seeking)

**DELETE** `/api/music/:filename` (Admin) - Delete music file

Storage: `public/uploads/music/`

## External Integrations

### Spotify

**GET** `/api/spotify` - Current/last played track

Returns:
```json
{
  "isPlaying": true,
  "track": "Song Name",
  "artist": "Artist Name",
  "album": "Album Name",
  "albumArt": "url",
  "albumArtAscii": "...",
  "spotifyUrl": "spotify:track:..."
}
```

**Setup:**
1. Create Spotify app at https://developer.spotify.com/dashboard
2. Get Client ID and Client Secret
3. Get refresh token (use Spotify OAuth flow)
4. Create `config/Spotify.json`:
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "refresh_token": "your_refresh_token"
}
```

Refresh token automatically rotates. Uses ASCII art conversion for album artwork.

### Discord Presence

**GET** `/api/discord` - Discord status via Lanyard

Returns:
```json
{
  "username": "User#1234",
  "avatar": "url",
  "avatarAscii": "...",
  "status": "online",
  "customStatus": "...",
  "activities": [...],
  "listening": { "song": "...", "artist": "..." }
}
```

**Configuration:**
Hard-coded user ID: `333274561430683649`

Change in [backend/routes/discord.js:4](../backend/routes/discord.js#L4)

### Nintendo Switch Presence

**GET** `/api/nintendo` - Switch game status

Returns:
```json
{
  "username": "Player",
  "isOnline": true,
  "game": {
    "name": "Game Title",
    "imageUrl": "url",
    "imageAscii": "...",
    "sysDescription": "...",
    "playTime": "..."
  }
}
```

**Configuration:**
Hard-coded friend code: `9167f8e6c934c73b`

Change in [backend/routes/nintendo.js:4](../backend/routes/nintendo.js#L4)

Requires nxapi-presence server running.

### GitHub Versions

**GET** `/api/versions` - Latest release versions

Returns:
```json
{
  "kitty": "0.32.2",
  "fish": "3.7.0",
  "hyprland": "0.36.0",
  "lastFetch": "2024-01-01T00:00:00.000Z"
}
```

Cached for 1 hour. Fallback versions if GitHub API fails.

## Web Scraping

### Ado Tours

**POST** `/api/ado-tours/sync` (Admin) - Scrape Wikipedia and sync

**GET** `/api/ado-tours/debug` (Admin) - Debug scraper

Scrapes: https://en.wikipedia.org/wiki/Ado_(singer)

Parses tour tables for: tour name, dates, venues

Storage: `config/ado-tours.json`

### Ado Awards

**POST** `/api/ado-awards/sync` (Admin) - Scrape Wikipedia and sync

**GET** `/api/ado-awards/debug` (Admin) - Debug scraper

Scrapes award tables for: year, ceremony, category, work, result

Storage: `config/ado-awards.json`

## Deployment

### Docker

```bash
docker build -t mejedo .
docker run -p 3000:3000 -p 4000:4000 \
  -v ./config:/app/config \
  -v ./public/uploads:/app/public/uploads \
  mejedo
```

### PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Environment

No `.env` file used. Configuration is file-based:
- Database: `config/medjed.db`
- Data: `config/*.json`
- Spotify: `config/Spotify.json`
- Uploads: `public/uploads/`

## API Proxy

Next.js proxies `/api/*` to `http://127.0.0.1:4000/api/*`

Configured in [next.config.mjs](../next.config.mjs)

## Security Notes

⚠️ **Image upload endpoint has no auth check** - Anyone can upload
⚠️ **Guestbook admin endpoints lack auth middleware** - Should be admin-only
⚠️ **Default admin password** - Change immediately in production
⚠️ **Session secret** - Uses default, should be randomized

## Data Backup

Important files to backup:
```
config/medjed.db              # User accounts
config/blogposts.json
config/guestbook.json
config/consoles.json
config/manga.json
config/shitposts.json
config/ado-*.json
config/speedrunLeaderboard.json
config/Spotify.json           # API credentials
public/uploads/               # All uploaded files
```

## Development

```bash
# Start backend only
npm run server

# Start frontend only
npm run dev

# Both (use PM2)
pm2 start ecosystem.config.js --watch
```

Backend runs on port 4000, frontend on port 3000.
