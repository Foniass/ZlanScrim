"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam } from "@/app/actions/admin";

export function CreateTeamForm({
  tournamentId,
  teamSize,
  availablePlayers,
}: {
  tournamentId: string;
  teamSize: number;
  availablePlayers: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= teamSize) return curr;
      return [...curr, id];
    });
  };

  const canSubmit =
    name.trim().length > 0 && selected.length === teamSize && !pending;

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createTeam(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Équipe créée");
        setSelected([]);
        setName("");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="memberIds" value={id} />
      ))}

      <div className="space-y-1.5">
        <Label htmlFor="team-name">Nom de l&apos;équipe</Label>
        <Input
          id="team-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Les Pandas"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          Membres ({selected.length}/{teamSize})
        </Label>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
          {availablePlayers.map((p) => {
            const checked = selected.includes(p.id);
            const disabled = !checked && selected.length >= teamSize;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent ${
                  disabled ? "opacity-40" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                {p.name}
              </label>
            );
          })}
        </div>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        {pending ? "Création..." : "Créer l'équipe"}
      </Button>
    </form>
  );
}
