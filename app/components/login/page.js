"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [typedCmd, setTypedCmd] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);
  const command = "login";

  // ---------------- Login Logic ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/"); // redirect to main page
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setLoading(false);
    }

  setTimeout(() => {
      if (username === "admin" && password === "password") {
        alert("Login successful!");
      } else {
        setError("Invalid credentials");
      }
      setLoading(false);
    }, 1000);
  };

  // Typing animation for "login"
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedCmd(command.slice(0, i));
      i++;
      if (i > command.length) {
        clearInterval(interval);
        setTimeout(() => setDoneTyping(true), 300);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);
// ---------------- Render ----------------
  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen text-white justify-start bg-[#0D0D0F]">

      {/* LOGIN TERMINAL */}
      <div className="flex-1 min-w-[500px] min-h-[450px] bg-[#121217] border-2 border-[#39ff14] shadow-lg flex flex-col font-jetbrains">

        {/* Typing animation */}
        {!doneTyping && (
          <div className="p-8 text-xl flex flex-wrap">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-white ml-2">{typedCmd}</span>
            <span className="cursor animate-blink">|</span>
          </div>
        )}

        {/* Login form */}
        {doneTyping && (
          <div className="flex-1 p-8 flex flex-col justify-center">
            <header className="flex flex-col gap-4 max-w-sm mx-auto text-5xl pb-6"> Mejedo </header>
            <form onSubmit={handleLogin} className="flex flex-col gap-4 max-w-sm mx-auto">

              {/* Username */}
              <div>
                <label className="block text-[#39ff14] text-sm mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2  bg-[#1B1B1F] text-white outline-none border border-[#39ff14] focus:border-[#FF5555] transition"
                  placeholder="Username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[#39ff14] text-sm mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2  bg-[#1B1B1F] text-white outline-none border border-[#39ff14] focus:border-[#FF5555] transition"
                  placeholder="Password"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2  bg-[#1f8f0c] hover:bg-[#39ff14] text-white disabled:opacity-50 cursor-pointer transition"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
