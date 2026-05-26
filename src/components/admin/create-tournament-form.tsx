"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTournament } from "@/app/actions/admin";

export function CreateTournamentForm() {
  const [pending, startTransition] = useTransition();

  const handle = (formData: FormData) => {
    startTransition(async () => {
      const result = await createTournament(formData);
      if (result?.error) toast.error(result.error);
      // on success the action calls redirect(), so we won't reach this point
    });
  };

  return (
    <form action={handle} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          name="name"
          placeholder="ZLAN du dimanche"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Optionnel — ambiance, règles particulières, etc."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="teamSize">Taille des équipes</Label>
        <Input
          id="teamSize"
          name="teamSize"
          type="number"
          min={1}
          max={10}
          defaultValue={2}
          required
        />
        <p className="text-muted-foreground text-xs">
          1 = solo, 2 = duos, etc.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Créer"}
      </Button>
    </form>
  );
}
