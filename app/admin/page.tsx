"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { PersonForm } from "@/components/PersonForm";
import { PersonGrid } from "@/components/PersonGrid";
import { RecognitionLog } from "@/components/RecognitionLog";
import { useMimirStore } from "@/lib/store";
import { MOCK_PEOPLE } from "@/lib/mockData";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

const PIN_STORAGE_KEY = "mimir-admin-pin";
const DEFAULT_PIN = "1234";
const PIN_LENGTH = 4;

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(false);

    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === PIN_LENGTH - 1 && digit) {
      const pin = [...next.slice(0, PIN_LENGTH - 1), digit].join("");
      verifyPin(pin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = (pin: string) => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY) ?? DEFAULT_PIN;
    if (pin === stored) {
      onUnlock();
    } else {
      setError(true);
      setDigits(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        className="card-glass border-[rgba(120,200,255,0.15)] text-white sm:max-w-sm"
      >
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-[rgba(120,200,255,0.08)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(120,200,255,0.6)" strokeWidth="1.5" className="size-5">
              <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <DialogTitle className="font-mono text-sm tracking-widest text-white/80">
            Caregiver Access
          </DialogTitle>
          <DialogDescription className="text-xs text-white/35">
            Enter your 4-digit PIN to continue
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-3 py-2">
          {digits.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-13 w-13 rounded-xl bg-white/5 text-center font-mono text-xl text-white transition-all focus:scale-105 focus:bg-white/8 ${
                error ? "border-red-500/50 bg-red-500/5" : "border-white/12"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center font-mono text-[11px] text-red-400/80">
            Incorrect PIN — try again
          </p>
        )}
        {!error && (
          <p className="text-center font-mono text-[10px] text-white/15">
            PIN: {DEFAULT_PIN}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

type AdminTab = "people" | "enrol" | "log";

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("people");
  const { enrolledPeople, setEnrolledPeople, recognitionLog } = useMimirStore();
  const [loading, setLoading] = useState(false);

  // Fetch enrolled people from database
  useEffect(() => {
    const fetchPeople = async () => {
      if (!unlocked) return;
      
      setLoading(true);
      try {
        const res = await fetch("/api/people");
        const data = await res.json();
        
        if (data.success && data.people) {
          setEnrolledPeople(data.people);
        }
      } catch (error) {
        console.error("Failed to fetch people:", error);
        // Fallback to mock data if fetch fails
        if (enrolledPeople.length === 0) {
          setEnrolledPeople(MOCK_PEOPLE);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, [unlocked, setEnrolledPeople]);

  // Restore session unlock
  useEffect(() => {
    if (sessionStorage.getItem("mimir-admin-unlocked") === "true") setUnlocked(true);
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem("mimir-admin-unlocked", "true");
    setUnlocked(true);
    toast.success("Access granted.");
  };

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: "people", label: "People", count: enrolledPeople.length },
    { id: "enrol", label: "Enrol New" },
    { id: "log", label: "Session Log", count: recognitionLog.length || undefined },
  ];

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <Toaster theme="dark" />

      {!unlocked && <PinGate onUnlock={handleUnlock} />}

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[rgba(2,8,16,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-0">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2.5 py-4 pr-6 border-r border-white/8">
            <Link href="/" className="group flex items-center gap-2" title="Back to AR view">
              <span className="font-mono text-sm font-medium tracking-[0.2em] text-white/70 transition-colors group-hover:text-white/90">
                Mimir
              </span>
            </Link>
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/30">
              Caregiver
            </span>
          </div>

          {/* Tabs */}
          <nav className="flex items-stretch gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-4 font-mono text-xs tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? "border-[rgba(120,200,255,0.6)] text-white"
                    : "border-transparent text-white/35 hover:text-white/60"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums transition-colors ${
                    activeTab === tab.id
                      ? "bg-[rgba(120,200,255,0.12)] text-[rgba(120,200,255,0.8)]"
                      : "bg-white/6 text-white/30"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right — back link + sign out */}
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 font-mono text-[10px] tracking-widest text-white/35 transition-colors hover:border-white/15 hover:text-white/60"
            >
              ← AR View
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {activeTab === "people" && (
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-lg font-semibold text-white/90">Enrolled People</h1>
                <p className="mt-0.5 text-sm text-white/35">
                  {enrolledPeople.length} {enrolledPeople.length === 1 ? "person" : "people"} in memory
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("enrol")}
                className="btn-glass gap-2 text-white/70"
                size="sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Enrol Person
              </Button>
            </div>
            <PersonGrid />
          </div>
        )}

        {activeTab === "enrol" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-semibold text-white/90">Enrol a New Person</h1>
              <p className="mt-0.5 text-sm text-white/35">
                Add someone to the recognition memory
              </p>
            </div>
            <div className="w-full">
              <PersonForm onSuccess={() => setActiveTab("people")} />
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-semibold text-white/90">Session Log</h1>
              <p className="mt-0.5 text-sm text-white/35">
                Live recognition events from this session
              </p>
            </div>
            <RecognitionLog />
          </div>
        )}
      </main>
    </div>
  );
}
