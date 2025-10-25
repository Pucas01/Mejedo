"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Terminal() {
  const PROMPT = "pucas01@PucasArch:~$";
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const [currentInput, setCurrentInput] = useState("");
  const [outputs, setOutputs] = useState([]); // { cmd: string, result: string | JSX }
  const [history, setHistory] = useState([]); // previous commands
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    // autofocus the container so it receives keyboard events
    if (containerRef.current) containerRef.current.focus();
  }, []);

  useEffect(() => {
    // scroll to bottom whenever outputs or currentInput changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs, currentInput]);

  // keyboard handling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onKeyDown = (e) => {
      // If user is typing normally
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // printable
        setCurrentInput((s) => s + e.key);
        e.preventDefault();
        return;
      }

      if (e.key === "Backspace") {
        setCurrentInput((s) => s.slice(0, -1));
        e.preventDefault();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        runCommand(currentInput.trim());
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setCurrentInput(history[nextIndex] ?? "");
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (history.length === 0) return;
        if (historyIndex === -1) {
          setCurrentInput("");
          return;
        }
        const nextIndex = Math.min(history.length - 1, historyIndex + 1);
        setHistoryIndex(nextIndex === history.length ? -1 : nextIndex);
        setCurrentInput(history[nextIndex] ?? "");
        return;
      }

      if (e.key === "Tab") {
        // prevent tab out
        e.preventDefault();
        return;
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [currentInput, history, historyIndex]);

  async function runCommand(raw) {
    const cmd = raw.trim();
    if (cmd === "") {
      // print empty command line (like pressing enter with nothing)
      pushOutput(cmd, "");
      setHistory((h) => [...h, cmd]);
      setHistoryIndex(-1);
      setCurrentInput("");
      return;
    }

    // show the command immediately
    pushOutput(cmd, "…"); // temporary spinner
    setHistory((h) => [...h, cmd]);
    setHistoryIndex(-1);
    setCurrentInput("");

    // parse command
    const parts = cmd.split(/\s+/);
    const base = parts[0].toLowerCase();
    try {
      if (base === "help") {
        const helpText = `built-in commands:
help
clear
echo <text>
users                Show all users
adduser <u> <p> [r]  Add a user
deluser <u>          Delete a user
passwd <u> <p>       Reset user password
`;
        replaceLastOutput(cmd, helpText);
        return;
      }

      if (base === "clear") {
        // clear output history
        setOutputs([]);
        return;
      }

      if (base === "echo") {
        const txt = parts.slice(1).join(" ");
        replaceLastOutput(cmd, txt);
        return;
      }

      if (base === "users") {
        const res = await fetch("/api/users", { credentials: "include" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          replaceLastOutput(cmd, `Error: ${err.error || res.statusText}`);
          return;
        }
        const json = await res.json();
        // json.users expected
        const rows = (json.users || []).map((u) => `${u.username} (${u.role})`).join("\n");
        replaceLastOutput(cmd, rows || "(no users)");
        return;
      }

      if (base === "adduser" || base === "add") {
        if (parts.length < 3) {
          replaceLastOutput(cmd, "Usage: adduser <username> <password> [role]");
          return;
        }
        const username = parts[1];
        const password = parts[2];
        const role = parts[3] || "user";
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password, role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          replaceLastOutput(cmd, `Error: ${data.error || res.statusText}`);
        } else {
          replaceLastOutput(cmd, `✔ Created user '${username}' (role=${role})`);
        }
        return;
      }

      if (base === "deluser" || base === "delete" || base === "del") {
        if (parts.length < 2) {
          replaceLastOutput(cmd, "Usage: deluser <username>");
          return;
        }
        const username = parts[1];
        const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          replaceLastOutput(cmd, `Error: ${data.error || res.statusText}`);
        } else {
          replaceLastOutput(cmd, `✔ Deleted user '${username}'`);
        }
        return;
      }

      if (base === "passwd" || base === "pass") {
        if (parts.length < 3) {
          replaceLastOutput(cmd, "Usage: passwd <username> <newpassword>");
          return;
        }
        const username = parts[1];
        const password = parts[2];
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          replaceLastOutput(cmd, `Error: ${data.error || res.statusText}`);
        } else {
          replaceLastOutput(cmd, `✔ Password updated for '${username}'`);
        }
        return;
      }

      // unknown command
      replaceLastOutput(cmd, `command not found: ${base}`);
    } catch (err) {
      console.error("command error", err);
      replaceLastOutput(cmd, `Error: ${err?.message || String(err)}`);
    }
  }

  function pushOutput(cmd, result) {
    setOutputs((o) => [...o, { cmd, result }]);
    // small timeout to ensure scroll runs after render
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 10);
  }

  function replaceLastOutput(cmd, result) {
    setOutputs((o) => {
      const copy = o.slice();
      copy[copy.length - 1] = { cmd, result };
      return copy;
    });
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 10);
  }

  // clicking the terminal focuses it
  function handleFocus() {
    setFocused(true);
    if (containerRef.current) containerRef.current.focus();
  }

  function handleBlur() {
    setFocused(false);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="w-full min-h-[220px] max-h-[520px] bg-[#121217] border-2 border-[#39ff14] shadow-lg p-4 font-jetbrains text-white outline-none"
      style={{ caretColor: "transparent" }}
      role="application"
      aria-label="Terminal"
    >
      {/* scroll area */}
      <div ref={scrollRef} className="overflow-auto max-h-[480px] pr-2">
        {outputs.map((o, idx) => (
          <div key={idx} className="mb-3">
            <div className="flex flex-wrap items-center">
              <span className="text-[#39ff14] mr-2">{PROMPT}</span>
              <span className="text-white font-mono">{o.cmd}</span>
            </div>
            <pre className="whitespace-pre-wrap text-gray-300 mt-1">{o.result}</pre>
          </div>
        ))}

        {/* Current prompt / input */}
        <div className="flex items-center">
          <span className="text-[#39ff14] mr-2">{PROMPT}</span>
          <div
            aria-live="polite"
            className="text-white min-h-[1.25rem]"
            // show current input and blinking cursor
          >
            <span>{currentInput}<span className="animate-blink">|</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
