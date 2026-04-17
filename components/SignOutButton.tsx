"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className={
        className ??
        "flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-white/25 transition-colors hover:text-white/55"
      }
    >
      Sign Out
      <span className="text-[8px]">⏻</span>
    </button>
  );
}
