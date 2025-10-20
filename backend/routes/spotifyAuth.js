import fetch from "node-fetch";

let accessToken = "";

export async function getAccessToken() {
  // If token already exists, return it
  if (accessToken) return accessToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

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
    return accessToken;
  } else {
    throw new Error("Failed to refresh Spotify token: " + JSON.stringify(data));
  }
}
