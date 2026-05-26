import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { RoundStatus, MatchStatus } from "@/lib/tournament";

const roundStatusLabel: Record<RoundStatus, string> = {
  PENDING: "À venir",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
};

export async function ParticipantView({
  tournamentId,
  isAdmin: _isAdmin,
}: {
  tournamentId: string;
  isAdmin: boolean;
}) {
  const [teams, rounds] = await Promise.all([
    db.team.findMany({
      where: { tournamentId },
      include: {
        members: { include: { user: { select: { name: true, image: true } } } },
      },
      orderBy: { seed: "asc" },
    }),
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

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Équipes</h2>
        {teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Les équipes seront annoncées par l&apos;organisateur.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {t.seed ? (
                      <span className="text-muted-foreground text-xs">
                        #{t.seed}
                      </span>
                    ) : null}
                    {t.name}
                  </CardTitle>
                  <CardDescription>
                    {t.members.length} membre
                    {t.members.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {t.members.map((m) => (
                      <li key={m.id} className="truncate">
                        {m.user.name ?? "Inconnu"}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Bracket</h2>
        {rounds.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Le bracket n&apos;a pas encore été généré.
          </p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-2">
            {rounds.map((r) => (
              <div key={r.id} className="min-w-[240px] flex-shrink-0 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{r.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    {r.gameName} ·{" "}
                    {roundStatusLabel[r.status as RoundStatus]}
                  </p>
                </div>
                <div className="space-y-2">
                  {r.matches.map((m) => (
                    <MatchCard
                      key={m.id}
                      teamA={m.teamA}
                      teamB={m.teamB}
                      scoreA={m.scoreA}
                      scoreB={m.scoreB}
                      winnerId={m.winnerId}
                      status={m.status as MatchStatus}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MatchCard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  winnerId,
  status,
}: {
  teamA: { id: string; name: string; seed: number | null } | null;
  teamB: { id: string; name: string; seed: number | null } | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  status: MatchStatus;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="divide-y">
        <Row team={teamA} score={scoreA} isWinner={winnerId === teamA?.id} />
        <Row team={teamB} score={scoreB} isWinner={winnerId === teamB?.id} />
      </div>
      {status === "COMPLETED" && winnerId ? (
        <div className="bg-muted/60 flex items-center gap-1 px-3 py-1.5 text-xs">
          <Trophy className="h-3 w-3" />
          Match terminé
        </div>
      ) : status === "IN_PROGRESS" ? (
        <div className="bg-primary/10 px-3 py-1.5 text-xs">
          <Badge variant="default" className="text-[10px]">
            En cours
          </Badge>
        </div>
      ) : null}
    </Card>
  );
}

function Row({
  team,
  score,
  isWinner,
}: {
  team: { id: string; name: string; seed: number | null } | null;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 text-sm ${
        isWinner ? "font-semibold" : ""
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        {team?.seed ? (
          <span className="text-muted-foreground text-xs">#{team.seed}</span>
        ) : null}
        <span className="truncate">
          {team?.name ?? <em className="text-muted-foreground">à définir</em>}
        </span>
      </span>
      <span className="text-muted-foreground tabular-nums">
        {score ?? "–"}
      </span>
    </div>
  );
}
