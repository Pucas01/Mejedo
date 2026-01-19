"use client";

import { useState, useEffect } from "react";
import Button from "../ui/Button";
import WindowDecoration from "../window/WindowDecoration";

export default function DiscordBotSettings() {
  const [config, setConfig] = useState({
    token: "",
    clientId: "",
    guildId: "",
    enabled: false
  });
  const [webhookConfig, setWebhookConfig] = useState({
    webhookUrl: "",
    userId: "",
    enabled: false
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchConfig();
    fetchWebhookConfig();
    fetchStatus();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/discord-bot-config", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWebhookConfig() {
    try {
      const res = await fetch("/api/discord-webhook-config", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setWebhookConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch webhook config:", error);
    }
  }

  async function fetchStatus() {
    try {
      const res = await fetch("/api/discord-bot-config/status", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  }

  async function handleStartBot() {
    setMessage("");
    try {
      const res = await fetch("/api/discord-bot-config/start", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✔ " + data.message);
      } else {
        setMessage("✗ " + data.message);
      }
      await fetchStatus();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    }
  }

  async function handleStopBot() {
    setMessage("");
    try {
      const res = await fetch("/api/discord-bot-config/stop", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✔ " + data.message);
      } else {
        setMessage("✗ " + data.message);
      }
      await fetchStatus();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    }
  }

  async function handleRestartBot() {
    setMessage("Restarting bot...");
    try {
      const res = await fetch("/api/discord-bot-config/restart", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✔ " + data.message);
      } else {
        setMessage("✗ " + data.message);
      }
      await fetchStatus();
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/discord-bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✔ Configuration saved! Restart the server to apply changes.");
        await fetchStatus();
      } else {
        setMessage(`✗ Error: ${data.error || "Failed to save"}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled() {
    const newEnabled = !config.enabled;
    setConfig({ ...config, enabled: newEnabled });

    try {
      const res = await fetch("/api/discord-bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: newEnabled })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✔ Bot ${newEnabled ? "enabled" : "disabled"}! ${data.message || ""}`);
        await fetchStatus();
      } else {
        setMessage(`✗ Error: ${data.error || "Failed to toggle"}`);
        setConfig({ ...config, enabled: !newEnabled }); // Revert on error
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
      setConfig({ ...config, enabled: !newEnabled }); // Revert on error
    }
  }

  async function handleSaveWebhook() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/discord-webhook-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(webhookConfig)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✔ Webhook configuration saved!");
      } else {
        setMessage(`✗ Error: ${data.error || "Failed to save webhook"}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#121217] border-2 border-[#39ff14] p-4">
        <WindowDecoration title="Discord Bot Settings" showControls={false} />
        <div className="p-4 text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#121217] border-2 border-[#39ff14]">
      <WindowDecoration title="Discord Bot Settings" showControls={false} />

      <div className="p-6 space-y-6">
        {/* Status Indicators */}
        {status && (
          <div className="bg-[#1a1a1f] border border-[#39ff14] p-4 space-y-2">
            <h3 className="text-[#39ff14] font-bold mb-3">Bot Status</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={status.configured ? "text-green-400" : "text-red-400"}>
                  {status.configured ? "✔" : "✗"}
                </span>
                <span className="text-white">Configured</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={status.enabled ? "text-green-400" : "text-gray-400"}>
                  {status.enabled ? "✔" : "✗"}
                </span>
                <span className="text-white">Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={status.running ? "text-green-400" : "text-gray-400"}>
                  {status.running ? "✔" : "✗"}
                </span>
                <span className="text-white">Running</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={status.hasGuildId ? "text-green-400" : "text-gray-400"}>
                  {status.hasGuildId ? "✔" : "✗"}
                </span>
                <span className="text-white">Guild ID Set</span>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-[#39ff14] text-sm font-bold mb-2">
              Bot Token
            </label>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 font-mono"
              placeholder={config.token === "***SET***" ? "Token is set" : "Enter bot token"}
            />
          </div>

          <div>
            <label className="block text-[#39ff14] text-sm font-bold mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 font-mono"
              placeholder="Enter application client ID"
            />
          </div>

          <div>
            <label className="block text-[#39ff14] text-sm font-bold mb-2">
              Guild ID (Optional)
            </label>
            <input
              type="text"
              value={config.guildId}
              onChange={(e) => setConfig({ ...config, guildId: e.target.value })}
              className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 font-mono"
              placeholder="Leave empty for global commands"
            />
            <p className="text-gray-400 text-xs mt-1">
              Set guild ID for instant command updates (dev). Leave empty for global commands (production).
            </p>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3 bg-[#1a1a1f] border border-[#39ff14] p-3">
            <input
              type="checkbox"
              id="bot-enabled"
              checked={config.enabled}
              onChange={toggleEnabled}
              className="accent-[#39ff14] w-4 h-4"
            />
            <label htmlFor="bot-enabled" className="text-white cursor-pointer">
              Enable Discord Bot
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Bot Configuration"}
            </Button>
          </div>

          {/* Bot Control Buttons */}
          <div className="flex gap-3 bg-[#1a1a1f] border border-[#39ff14] p-4">
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartBot}
              disabled={status?.running}
            >
              Start Bot
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStopBot}
              disabled={!status?.running}
            >
              Stop Bot
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestartBot}
            >
              Restart Bot
            </Button>
          </div>
        </div>

        {/* Webhook Notifications Section */}
        <div className="border-t-2 border-[#39ff14] pt-6 space-y-4">
          <h3 className="text-[#39ff14] font-bold text-lg">Webhook Notifications</h3>
          <p className="text-gray-400 text-sm">
            Get Discord notifications for events like failed login attempts
          </p>

          <div>
            <label className="block text-[#39ff14] text-sm font-bold mb-2">
              Webhook URL
            </label>
            <input
              type="text"
              value={webhookConfig.webhookUrl}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, webhookUrl: e.target.value })}
              className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 font-mono text-sm"
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="text-gray-400 text-xs mt-1">
              Create a webhook in your Discord server settings → Integrations → Webhooks
            </p>
          </div>

          <div>
            <label className="block text-[#39ff14] text-sm font-bold mb-2">
              User ID to Mention (Optional)
            </label>
            <input
              type="text"
              value={webhookConfig.userId}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, userId: e.target.value })}
              className="w-full bg-[#1a1a1f] border border-[#39ff14] text-white px-3 py-2 font-mono"
              placeholder="Your Discord user ID"
            />
            <p className="text-gray-400 text-xs mt-1">
              You'll be mentioned in webhook notifications (Right-click your profile → Copy User ID)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#1a1a1f] border border-[#39ff14] p-3">
            <input
              type="checkbox"
              id="webhook-enabled"
              checked={webhookConfig.enabled}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, enabled: e.target.checked })}
              className="accent-[#39ff14] w-4 h-4"
            />
            <label htmlFor="webhook-enabled" className="text-white cursor-pointer">
              Enable Webhook Notifications
            </label>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveWebhook}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Webhook Settings"}
          </Button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 border ${message.startsWith("✔") ? "border-green-400 text-green-400" : "border-red-400 text-red-400"} bg-[#1a1a1f]`}>
            {message}
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-[#1a1a1f] border border-[#39ff14] p-4 space-y-2 text-sm">
          <h3 className="text-[#39ff14] font-bold">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-300">
            <li>Create a bot at <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-[#39ff14] underline">Discord Developer Portal</a></li>
            <li>Copy the bot token and client ID from your application</li>
            <li>Paste them into the fields above</li>
            <li>(Optional) Add your server ID for faster command updates during development</li>
            <li>Enable the bot and save configuration</li>
            <li>Click "Start Bot" to launch the bot without restarting the backend</li>
            <li>Invite the bot using: <code className="text-[#39ff14]">https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
