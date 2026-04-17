"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMimirStore } from "@/lib/store";
import { PersonForm } from "./PersonForm";
import type { Person } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PersonCard({ person }: { person: Person }) {
  const [editOpen, setEditOpen] = useState(false);
  const { removeEnrolledPerson } = useMimirStore();
  const recognitionLog = useMimirStore((s) => s.recognitionLog);

  const lastSeen = recognitionLog.find((e) => e.personId === person.id);
  const lastSeenStr = lastSeen
    ? new Date(lastSeen.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : person.lastSeen ?? "Never";

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/enrol?id=${person.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("Failed to remove");
      removeEnrolledPerson(person.id);
      toast.success(`${person.name} removed.`);
    } catch {
      toast.error("Could not remove person.");
    }
  };

  return (
    <>
      <Card className="card-glass group flex flex-col gap-0 py-0">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              {person.photoUrl && <AvatarImage src={person.photoUrl} alt={person.name} />}
              <AvatarFallback className="bg-[rgba(120,200,255,0.08)] text-[rgba(120,200,255,0.7)] text-sm font-mono">
                {initials(person.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white/90">{person.name}</p>
              <Badge className="badge-relation mt-1">{person.relationship}</Badge>
            </div>
          </div>

          {person.note && (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/45">{person.note}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-white/30">Last seen {lastSeenStr}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditOpen(true)}
                className="text-white/40 hover:text-white/80"
                aria-label="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
                  <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                  <path d="M19.5 7.125L12.75 13.875" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDelete}
                className="text-white/40 hover:text-red-400"
                aria-label="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
                  <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="card-glass border-[rgba(120,200,255,0.18)] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white/80">Edit {person.name}</DialogTitle>
          </DialogHeader>
          <PersonForm
            prefill={person}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PersonGrid() {
  const enrolledPeople = useMimirStore((s) => s.enrolledPeople);

  if (enrolledPeople.length === 0) {
    return (
      <div className="card-glass rounded-2xl px-6 py-12 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/25">
          No people enrolled yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {enrolledPeople.map((person) => (
        <PersonCard key={person.id} person={person} />
      ))}
    </div>
  );
}
