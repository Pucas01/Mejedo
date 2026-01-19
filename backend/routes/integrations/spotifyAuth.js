import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "config", "Spotify.json");
const CONFIG_DIR = path.join(process.cwd(), "config");
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);

let accessToken = "";

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({
      client_id: "",
      client_secret: "",
      refresh_token: "",
      access_token: "",
      expires_at: 0
    }, null, 2)
  );
}

export async function getAccessToken() {
  // Read credentials and token info from JSON
  const fileData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const now = Date.now();

  // Return cached token if not expired
  if (accessToken && now < fileData.expires_at) {
    return accessToken;
  }

  const { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken } = fileData;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Spotify credentials are missing in Spotify.json");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    accessToken = data.access_token;

    // Calculate expiration timestamp
    const expiresAt = now + data.expires_in * 1000;

    // Save updated token info back to JSON
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          ...fileData,
          access_token: accessToken,
          expires_at: expiresAt
        },
        null,
        2
      )
    );

    return accessToken;
  } else {
    throw new Error("Failed to refresh Spotify token: " + JSON.stringify(data));
  }
}
