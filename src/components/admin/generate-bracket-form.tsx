"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateBracketForTournament } from "@/app/actions/admin";

export function GenerateBracketForm({
  tournamentId,
  numRounds,
}: {
  tournamentId: string;
  numRounds: number;
}) {
  const [pending, startTransition] = useTransition();

  const handle = (formData: FormData) => {
    startTransition(async () => {
      const result = await generateBracketForTournament(formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Bracket généré");
    });
  };

  return (
    <form action={handle} className="space-y-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="space-y-3">
        {Array.from({ length: numRounds }).map((_, i) => {
          const fromEnd = numRounds - 1 - i;
          const label =
            fromEnd === 0
              ? "Finale"
              : fromEnd === 1
                ? "Demi-finales"
                : fromEnd === 2
                  ? "Quarts de finale"
                  : `Tour ${i + 1}`;
          return (
            <div key={i} className="space-y-1.5">
              <Label htmlFor={`game-${i}`}>{label}</Label>
              <Input
                id={`game-${i}`}
                name="gameNames"
                placeholder="Trackmania, Fortnite, etc."
                required
              />
            </div>
          );
        })}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Génération..." : "Générer le bracket"}
      </Button>
    </form>
  );
}
