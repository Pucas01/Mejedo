"use client";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import { useAchievements } from "../../hooks/useAchievements.js";
import Sticker from "../stickers/Sticker";
import WindowDecoration from "../window/WindowDecoration.jsx";
import Button from "../ui/Button";

export default function GuestBook() {
  const { currentUser, isAdmin } = useCurrentUser();
  const { unlock, unlockedAchievements } = useAchievements();

  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState({});

  const ensureProtocol = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handleWebsiteClick = (e, url) => {
    // If already unlocked, just open normally
    if (unlockedAchievements.guestbook_visitor) {
      return;
    }

    // Prevent default link behavior
    e.preventDefault();

    // Unlock achievement first
    unlock("guestbook_visitor");

    // Wait for achievement toast to show, then open link
    setTimeout(() => {
      window.open(ensureProtocol(url), "_blank", "noopener,noreferrer");
    }, 2000);
  };

  const fetchMessages = async () => {
    const url = isAdmin ? "/api/guestbook/admin" : "/api/guestbook";
    const res = await fetch(url);
    const data = await res.json();
    setMessages(data.reverse());
  };

  useEffect(() => {
    fetchMessages();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !message) return;

    const sanitizedName = DOMPurify.sanitize(name);
    const sanitizedMessage = DOMPurify.sanitize(message);
    const sanitizedWebsite = website ? DOMPurify.sanitize(website) : "";

    await fetch("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sanitizedName, message: sanitizedMessage, website: sanitizedWebsite }),
    });

    // Unlock guestbook achievement
    unlock("guestbook_signer");

    setName("");
    setMessage("");
    setWebsite("");
    fetchMessages();
  };

  const approveMessage = async (id) => {
    await fetch(`/api/guestbook/approve/${id}`, { method: "PATCH" });
    fetchMessages();
  };

  const sendReply = async (id) => {
    if (!replyText[id]) return;
    await fetch(`/api/guestbook/reply/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: DOMPurify.sanitize(replyText[id]) }),
    });
    setReplyText(prev => ({ ...prev, [id]: "" }));
    fetchMessages();
  };

  const deleteMessage = async (id) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    await fetch(`/api/guestbook/${id}`, { method: "DELETE" });
    fetchMessages();
  };

  return (
    <div className="flex flex-col p-4 gap-4 text-xl font-jetbrains">

      <div className="flex-1 min-w-[400px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col relative">
        <WindowDecoration title="Kitty - docs.pucas01.com" showControls={true} />
        <div className="p-4">
        <Sticker
          src="/stickers/futaba-pointing.png"
          position="top-right"
          size={70}
          rotation={-10}
          offset={{ x: 20, y: -20 }}
        />
        <p>┌─ Guestbook ───────────────────────────────</p>
        <p>│ Woah, a guestbook! That's pretty wild!</p>
        <p>│ Feel free to leave a message if you're cool.</p>
        <p>│ All messages have to be approve by me before they show up.</p>
        <p>│ Nickname and Message fields support HTML, sanitized with DOMPurify.</p>
        <p className="pb-2">└───────────────────────────────────────────</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
          <input type="text" placeholder="Nickname" value={name} onChange={e => setName(e.target.value)} className="bg-[#121217] border border-[#39ff14] px-2 py-1" />
          <input type="text" placeholder="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)} className="bg-[#121217] border border-[#39ff14] px-2 py-1" />
          <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} className="bg-[#121217] border border-[#39ff14] px-2 py-1 resize-none" />
          <Button type="submit" variant="primary">Send</Button>
        </form>
      </div>
    </div>

      <div className="flex-1 min-w-[400px] min-h-[200px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col space-y-2 relative">
        <WindowDecoration title="Kitty - Guestbook-posts.md" showControls={true} />
        <div className="p-4">
        <Sticker
          src="/stickers/futaba-shy.png"
          position="bottom-left"
          size={75}
          rotation={-5}
          offset={{ x: -25, y: 25 }}
        />
        {messages.length === 0 && <p className="text-gray-500">No messages yet!</p>}
        {messages.map(msg => (
          <div key={msg.id} className="whitespace-pre-wrap text-[#39ff14] border border-[#39ff14] p-3 flex flex-col gap-2">
            <p className="mb-1 text-gray-400">
              <span dangerouslySetInnerHTML={{ __html: msg.name}} />
              {msg.website && <a href={ensureProtocol(msg.website)} className=" hover:text-white" target="_blank" rel="noopener noreferrer" onClick={(e) => handleWebsiteClick(e, msg.website)}>{` (${msg.website})`}</a>}
              <span> </span>{new Date(msg.timestamp).toLocaleString()}
            </p>
            <hr className="border-gray-600 mb-1" />
            <p className="text-white" dangerouslySetInnerHTML={{ __html: msg.message }} />
            {msg.reply && <p className="text-[#32cc12]">Pucas01 Reply: {msg.reply}</p>}

            {isAdmin && (
              <div className="flex gap-2 mt-2">
                {!msg.approved && (
                  <Button onClick={() => approveMessage(msg.id)} variant="primary" size="sm">Approve</Button>
                )}
                <Button onClick={() => deleteMessage(msg.id)} variant="danger" size="sm">Delete</Button>
                <input
                  type="text"
                  placeholder="Reply..."
                  value={replyText[msg.id] || ""}
                  onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                  className="bg-[#121217] border border-[#39ff14] px-2 py-1 flex-1"
                />
                <Button onClick={() => sendReply(msg.id)} variant="primary" size="sm">Send Reply</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
