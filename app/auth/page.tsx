"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (err) {
          setError(err.message ?? "Sign-up failed");
          setLoading(false);
          return;
        }
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
        });
        if (err) {
          setError(err.message ?? "Invalid credentials");
          setLoading(false);
          return;
        }
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#020810]">

      {/* Subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(2,8,16,0.7) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Corner grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,200,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="font-mono text-lg font-medium tracking-[0.22em] text-white/90">
            Mimir
          </span>
          <span className="mx-3 inline-block h-px w-5 bg-[rgba(120,200,255,0.25)] align-middle" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            Memory Assistant
          </span>
          <p className="mt-3 font-mono text-[11px] text-white/25 tracking-wide">
            Caregiver Access Portal
          </p>
        </div>

        {/* Glass card */}
        <div className="card-glass relative rounded-2xl p-6">
          {/* Corner brackets */}
          <span className="bracket-corner bracket-tl" />
          <span className="bracket-corner bracket-tr" />
          <span className="bracket-corner bracket-bl" />
          <span className="bracket-corner bracket-br" />

          {/* Mode toggle */}
          <div className="mb-6 flex rounded-xl bg-white/4 p-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 font-mono text-[11px] tracking-widest uppercase transition-all ${
                  mode === m
                    ? "bg-[rgba(120,200,255,0.12)] text-[rgba(120,200,255,0.85)] shadow-sm"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[rgba(120,200,255,0.35)] focus:bg-white/8 focus:ring-1 focus:ring-[rgba(120,200,255,0.15)]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[rgba(120,200,255,0.35)] focus:bg-white/8 focus:ring-1 focus:ring-[rgba(120,200,255,0.15)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[rgba(120,200,255,0.35)] focus:bg-white/8 focus:ring-1 focus:ring-[rgba(120,200,255,0.15)]"
              />
            </div>

            {error && (
              <p className="font-mono text-[11px] text-red-400/80">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glass mt-2 w-full rounded-xl py-2.5 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-all hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "signin"
                ? "Sign In →"
                : "Create Account →"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] text-white/15">
          Mimir · Memory Assistant · v0.1
        </p>
      </div>
    </div>
  );
}
