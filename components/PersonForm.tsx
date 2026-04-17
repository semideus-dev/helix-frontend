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
  "Daughter",
  "Son",
  "Spouse",
  "Doctor",
  "Nurse",
  "Friend",
  "Caregiver",
  "Other",
];

interface PersonFormProps {
  prefill?: Partial<Person>;
  onSuccess?: () => void;
}

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship) {
      toast.error("Name and relationship are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("relationship", relationship);
      formData.append("note", note.trim());
      if (photo) formData.append("photo", photo);

      const res = await fetch("/api/enrol", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to enrol person");

      const newPerson: Person = {
        id: data.id,
        name: data.name,
        relationship: data.relationship,
        note: data.note,
        photoUrl: photoPreview ?? undefined,
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
                      {r}
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
