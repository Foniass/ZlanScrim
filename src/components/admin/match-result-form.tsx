"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { recordMatchResult } from "@/app/actions/admin";
import type { MatchStatus } from "@/lib/tournament";

type TeamSummary = { id: string; name: string; seed: number | null } | null;

export function MatchResultForm({
  matchId,
  teamA,
  teamB,
  scoreA,
  scoreB,
  winnerId,
  status,
  locked,
}: {
  matchId: string;
  teamA: TeamSummary;
  teamB: TeamSummary;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  status: MatchStatus;
  locked: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const both = teamA && teamB;
  const completed = status === "COMPLETED";
  const editable = both && !completed && !locked;

  const handle = (formData: FormData) => {
    startTransition(async () => {
      const result = await recordMatchResult(formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Score enregistré");
    });
  };

  return (
    <Card className="overflow-hidden p-0">
      <form action={handle}>
        <input type="hidden" name="matchId" value={matchId} />
        <div className="divide-y">
          <Row
            team={teamA}
            score={scoreA}
            isWinner={winnerId === teamA?.id}
            name="scoreA"
            editable={!!editable}
          />
          <Row
            team={teamB}
            score={scoreB}
            isWinner={winnerId === teamB?.id}
            name="scoreB"
            editable={!!editable}
          />
        </div>
        {completed ? (
          <div className="bg-muted/60 flex items-center gap-1 px-3 py-1.5 text-xs">
            <Trophy className="h-3 w-3" />
            Match terminé
          </div>
        ) : editable ? (
          <div className="bg-muted/30 p-2">
            <Button
              type="submit"
              size="xs"
              variant="default"
              className="w-full"
              disabled={pending}
            >
              {pending ? "..." : "Enregistrer le score"}
            </Button>
          </div>
        ) : (
          <div className="bg-muted/30 px-3 py-1.5 text-muted-foreground text-xs">
            En attente des équipes
          </div>
        )}
      </form>
    </Card>
  );
}

function Row({
  team,
  score,
  isWinner,
  name,
  editable,
}: {
  team: TeamSummary;
  score: number | null;
  isWinner: boolean;
  name: string;
  editable: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
        isWinner ? "font-semibold" : ""
      }`}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">
        {team?.seed ? (
          <span className="text-muted-foreground text-xs">#{team.seed}</span>
        ) : null}
        <span className="truncate">
          {team?.name ?? <em className="text-muted-foreground">à définir</em>}
        </span>
      </span>
      {editable ? (
        <Input
          name={name}
          type="number"
          min={0}
          defaultValue={score ?? ""}
          required
          className="h-7 w-16 text-right"
        />
      ) : (
        <span className="text-muted-foreground tabular-nums">
          {score ?? "–"}
        </span>
      )}
    </div>
  );
}
