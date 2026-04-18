"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMimirStore } from "@/lib/store";
import type { Person } from "@/types";
import { cn } from "@/lib/utils";

const RELATIONSHIPS = [
  "daughter",
  "son",
  "spouse",
  "doctor",
  "nurse",
  "friend",
  "caregiver",
  "family",
  "colleague",
  "other",
];

interface PersonFormProps {
  prefill?: Partial<Person>;
  onSuccess?: () => void;
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function PersonForm({ prefill, onSuccess }: PersonFormProps) {
  const [name, setName] = useState(prefill?.name ?? "");
  const [relationship, setRelationship] = useState(prefill?.relationship ?? "");
  const [note, setNote] = useState(prefill?.note ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(prefill?.photoUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addEnrolledPerson } = useMimirStore();

  const handlePhotoChange = (file: File) => {
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handlePhotoChange(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !relationship) {
      toast.error("Name and relationship are required.");
      return;
    }

    if (!photo && !prefill?.photoUrl) {
      toast.error("Photo is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert photo to base64
      let photoBase64 = prefill?.photoUrl || null;
      if (photo) {
        photoBase64 = await fileToBase64(photo);
      }

      // Send as JSON instead of FormData
      const res = await fetch("/api/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          relationship: relationship.toLowerCase(),
          note: note.trim(),
          photo: photoBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to enrol person");

      const newPerson: Person = {
        id: data.id,
        name: data.name,
        relationship: data.relationship,
        note: data.note,
        photoUrl: photoBase64 ?? undefined,
      };

      addEnrolledPerson(newPerson);
      toast.success(`${name} has been enrolled.`);
      setName("");
      setRelationship("");
      setNote("");
      setPhoto(null);
      setPhotoPreview(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrolment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide text-white/80">
          Enrol New Person
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="person-name" className="text-xs text-white/60">
                Full Name
              </Label>
              <Input
                id="person-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Mehta"
                required
                className="bg-white/5 text-white placeholder:text-white/25"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="person-relation" className="text-xs text-white/60">
                Relationship
              </Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="person-relation" className="w-full bg-white/5 text-white">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="person-note" className="text-xs text-white/60">
              Memory Note
            </Label>
            <Textarea
              id="person-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Visits every Sunday. Loves cooking dal makhani."
              className="bg-white/5 text-white placeholder:text-white/25"
              rows={3}
            />
          </div>

          {/* Photo drop zone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/60">Photo</Label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition-colors",
                isDragging
                  ? "border-[rgba(120,200,255,0.5)] bg-[rgba(120,200,255,0.08)]"
                  : "border-white/15 bg-white/3 hover:border-white/25"
              )}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <>
                  <span className="text-2xl text-white/20">📷</span>
                  <span className="text-[11px] text-white/35">
                    Drop photo here or click to browse
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoChange(file);
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-glass w-full text-white/80"
          >
            {isSubmitting ? "Enrolling…" : "Enrol Person"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
