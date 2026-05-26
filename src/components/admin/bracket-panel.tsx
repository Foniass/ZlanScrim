import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type MatchStatus,
  type RoundStatus,
  type TournamentStatus,
} from "@/lib/tournament";
import { GenerateBracketForm } from "@/components/admin/generate-bracket-form";
import { MatchResultForm } from "@/components/admin/match-result-form";

export async function BracketPanel({
  tournamentId,
  status,
}: {
  tournamentId: string;
  status: TournamentStatus;
}) {
  const [teams, rounds] = await Promise.all([
    db.team.count({ where: { tournamentId } }),
    db.round.findMany({
      where: { tournamentId },
      orderBy: { order: "asc" },
      include: {
        matches: {
          orderBy: { order: "asc" },
          include: {
            teamA: { select: { id: true, name: true, seed: true } },
            teamB: { select: { id: true, name: true, seed: true } },
          },
        },
      },
    }),
  ]);

  // Tournament hasn't generated a bracket yet.
  if (rounds.length === 0) {
    const bracketSize = teams > 0 ? 2 ** Math.ceil(Math.log2(teams)) : 0;
    const numRounds = bracketSize > 0 ? Math.log2(bracketSize) : 0;
    const canGenerate =
      teams >= 2 && (status === "SIGNUPS_CLOSED" || status === "SIGNUPS_OPEN");

    if (!canGenerate) {
      return (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            {teams < 2
              ? "Créez au moins 2 équipes avant de générer le bracket."
              : "Le bracket ne peut pas être généré à ce stade."}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Générer le bracket</CardTitle>
          <CardDescription>
            {teams} équipes → bracket de {bracketSize} ({numRounds} tour
            {numRounds > 1 ? "s" : ""}). Choisissez le jeu de chaque tour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateBracketForm
            tournamentId={tournamentId}
            numRounds={numRounds}
          />
        </CardContent>
      </Card>
    );
  }

  // Bracket exists — show it.
  return (
    <div className="space-y-6">
      <div className="text-muted-foreground text-sm">
        {status === "COMPLETED"
          ? "Tournoi terminé."
          : "Saisissez les scores au fur et à mesure. Les vainqueurs avancent automatiquement."}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-2">
        {rounds.map((r) => (
          <div key={r.id} className="min-w-[280px] flex-shrink-0 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">{r.name}</h3>
              <p className="text-muted-foreground text-xs">
                {r.gameName} ·{" "}
                {(r.status as RoundStatus) === "COMPLETED"
                  ? "Terminé"
                  : "En cours"}
              </p>
            </div>
            <div className="space-y-3">
              {r.matches.map((m) => (
                <MatchResultForm
                  key={m.id}
                  matchId={m.id}
                  teamA={m.teamA}
                  teamB={m.teamB}
                  scoreA={m.scoreA}
                  scoreB={m.scoreB}
                  winnerId={m.winnerId}
                  status={m.status as MatchStatus}
                  locked={status === "COMPLETED"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
