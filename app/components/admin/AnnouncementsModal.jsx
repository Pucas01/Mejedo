"use client";

import { useState, useEffect } from "react";
import Button from "../ui/Button";
import WindowDecoration from "../window/WindowDecoration";

export default function AnnouncementsModal({ show, onClose }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    color: "#39ff14"
  });

  useEffect(() => {
    if (show) {
      fetchChannels();
    }
  }, [show]);

  async function fetchChannels() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements/channels", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      } else {
        setMessage("Failed to fetch announcement channels");
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAnnouncement() {
    if (!announcement.title.trim() || !announcement.message.trim()) {
      setMessage("✗ Title and message are required");
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const res = await fetch("/api/announcements/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(announcement)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✔ ${data.message}`);

        // Show detailed results
        if (data.results.successful.length > 0) {
          console.log("Successfully sent to:", data.results.successful);
        }
        if (data.results.failed.length > 0) {
          console.log("Failed to send to:", data.results.failed);
        }

        // Clear form on success
        setAnnouncement({
          title: "",
          message: "",
          color: "#39ff14"
        });
      } else {
        setMessage(`✗ ${data.error || "Failed to send announcement"}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[800px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        <WindowDecoration title="Announcements Manager" onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-[#39ff14] text-xl font-bold">Send Announcement</h2>
          </div>

          {/* Configured Channels */}
          <div className="bg-[#1a1a1f] border border-[#39ff14] p-4 space-y-3">
            <h3 className="text-[#39ff14] font-bold">Configured Servers</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : channels.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No announcement channels configured yet.
              </p>
            ) : (
              <div className="space-y-2">
                {channels.map((channel, idx) => (
                  <div key={idx} className="text-sm text-white flex items-center gap-2">
                    <span className="text-green-400">✔</span>
                    <span className="font-bold">{channel.guild_name || `Guild ${channel.guild_id}`}</span>
                    {channel.channel_name && (
                      <span className="text-gray-400">→ #{channel.channel_name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcement Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-[#39ff14] text-sm font-bold mb-2">
                Announcement Title
              </label>
              <input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2"
                placeholder="e.g., New Feature Released!"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-[#39ff14] text-sm font-bold mb-2">
                Message
              </label>
              <textarea
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 h-32 resize-none"
                placeholder="Enter your announcement message here..."
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-[#39ff14] text-sm font-bold mb-2">
                Embed Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={announcement.color}
                  onChange={(e) => setAnnouncement({ ...announcement, color: e.target.value })}
                  className="w-16 h-10 bg-[#1a1a1f] border border-[#39ff14] cursor-pointer"
                />
                <input
                  type="text"
                  value={announcement.color}
                  onChange={(e) => setAnnouncement({ ...announcement, color: e.target.value })}
                  className="bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 font-mono text-sm w-32"
                  placeholder="#39ff14"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnnouncement({ ...announcement, color: "#39ff14" })}
                    className="w-8 h-8 rounded border-2 border-white"
                    style={{ backgroundColor: "#39ff14" }}
                    title="Neon Green"
                  />
                  <button
                    onClick={() => setAnnouncement({ ...announcement, color: "#1db954" })}
                    className="w-8 h-8 rounded border-2 border-white"
                    style={{ backgroundColor: "#1db954" }}
                    title="Spotify Green"
                  />
                  <button
                    onClick={() => setAnnouncement({ ...announcement, color: "#D73DA3" })}
                    className="w-8 h-8 rounded border-2 border-white"
                    style={{ backgroundColor: "#D73DA3" }}
                    title="Pink"
                  />
                  <button
                    onClick={() => setAnnouncement({ ...announcement, color: "#FF5555" })}
                    className="w-8 h-8 rounded border-2 border-white"
                    style={{ backgroundColor: "#FF5555" }}
                    title="Red"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#1a1a1f] border border-[#39ff14] p-4 space-y-3">
            <h3 className="text-[#39ff14] font-bold text-sm">Preview</h3>
            <div
              className="border-l-4 p-4 space-y-2"
              style={{ borderColor: announcement.color }}
            >
              <div className="font-bold text-lg text-white">
                {announcement.title || "Announcement Title"}
              </div>
              <div className="text-gray-300 whitespace-pre-wrap">
                {announcement.message || "Your announcement message will appear here..."}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>Mejedo Announcement</span>
                <span>•</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 border ${message.startsWith("✔") ? "border-green-400 text-green-400" : "border-red-400 text-red-400"} bg-[#1a1a1f]`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSendAnnouncement}
              disabled={sending || channels.length === 0}
            >
              {sending ? "Sending..." : "Send Announcement"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
