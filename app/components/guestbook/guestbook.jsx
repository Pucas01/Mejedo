"use client";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

export default function GuestBook() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/guestbook");
      const data = await res.json();
      setMessages(data.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !message) return;

    const sanitizedName = DOMPurify.sanitize(name, { USE_PROFILES: { html: true } });
    const sanitizedMessage = DOMPurify.sanitize(message, { USE_PROFILES: { html: true } });
    const sanitizedWebsite = website
      ? DOMPurify.sanitize(website, { USE_PROFILES: { html: false } })
      : "";

    try {
      await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedName,
          message: sanitizedMessage,
          website: sanitizedWebsite,
        }),
      });

      setName("");
      setMessage("");
      setWebsite("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col p-4 gap-4 text-xl">
      {/* Input Terminal */}
      <div className="flex-1 min-w-[400px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col p-4">
        <div className="space-y-">
          <p>┌─ Guestbook ───────────────────────────────</p>
          <p>│ Woah, a guestbook! That's pretty wild!</p>
          <p>│</p>
          <p>│ Feel free to leave a message if you're cool.</p>
          <p>│</p>
          <p>│ Nickname and Message fields support HTML, sanitized with DOMPurify.</p>
          <p className="pb-2">└───────────────────────────────────────────</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 font-jetbrains">
          <input
            type="text"
            placeholder="Nickname / Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#121217] border border-[#39ff14] text-[#39ff14] px-2 py-1"
          />
          <input
            type="text"
            placeholder="Website (optional)"
            value={website}
            onChange={(e) => {
              let val = e.target.value;

              
              if (val && !val.startsWith("https://") && !val.startsWith("http://")) {
                val = "https://" + val;
              }

              setWebsite(val);
            }}
            className="bg-[#121217] border border-[#39ff14] text-[#39ff14] px-2 py-1"
          />
          <textarea
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-[#121217] border border-[#39ff14] text-[#39ff14] px-2 py-1 resize-none"
          />
          <button
            type="submit"
            className="bg-[#39ff14] text-black px-4 py-1 hover:bg-[#32cc12] w-max"
          >
            Send
          </button>
        </form>
      </div>

      {/* Messages Terminal */}
      <div className="flex-1 min-w-[400px] min-h-[200px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col overflow-auto p-4 font-jetbrains space-y-2">
        {messages.length === 0 && <p className="text-gray-500">No messages yet!</p>}

        {messages.map((msg) => (
          <div key={msg.id} className="whitespace-pre-wrap text-[#39ff14] border border-[#39ff14] p-3">
            <p className="mb-1 text-gray-400">
              <span
                className="text-[#39ff14]"
                dangerouslySetInnerHTML={{ __html: msg.name }}
              />
              {msg.website && (
                <a href={msg.website} className=" hover:text-white">
                  {` (${msg.website})`}
                </a>
              )} — {new Date(msg.timestamp).toLocaleString()}
            </p>
            <hr className="border-gray-600 mb-1" />
            <p
              className="text-white"
              dangerouslySetInnerHTML={{ __html: msg.message }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
